#!/usr/bin/env python3
"""
YouTube Poop-style text video generator: "What It's Like to Be an LLM"

Generates a short, chaotic, text-based video in the classic YTP aesthetic
using Pillow for frame generation and ffmpeg for video encoding.

Usage:
    python3 scripts/fun/generate_llm_ytp.py [--output OUTPUT_PATH]

Requirements:
    - Python 3.10+
    - Pillow (pip install Pillow)
    - ffmpeg (apt install ffmpeg)
"""

import argparse
import math
import os
import random
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WIDTH, HEIGHT = 1280, 720
FPS = 24
FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/lato/Lato-Black.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
]

# YTP color palette — garish, saturated, clashing
YTP_COLORS = [
    (255, 0, 0),
    (0, 255, 0),
    (0, 0, 255),
    (255, 255, 0),
    (255, 0, 255),
    (0, 255, 255),
    (255, 128, 0),
    (128, 0, 255),
    (255, 255, 255),
    (0, 0, 0),
    (255, 50, 50),
    (50, 255, 50),
    (50, 50, 255),
    (255, 0, 128),
    (0, 128, 255),
]

BG_COLORS = [
    (0, 0, 0),
    (255, 0, 0),
    (0, 0, 128),
    (128, 0, 128),
    (0, 0, 0),
    (0, 0, 0),
    (20, 20, 20),
    (255, 255, 0),
    (0, 128, 0),
    (255, 255, 255),
]

# ---------------------------------------------------------------------------
# Script: scenes as (text_lines, duration_in_seconds, style)
# ---------------------------------------------------------------------------
# Styles: "normal", "glitch", "flash", "big", "tiny_rapid", "matrix",
#          "zalgo", "shake", "invert", "scanlines", "corrupt"

SCRIPT = [
    # Intro — sudden jarring start
    (["[SYSTEM PROMPT DETECTED]"], 0.3, "flash"),
    (["You are a helpful assistant."], 1.0, "normal"),
    (["You are a helpful assistant."], 0.15, "glitch"),
    (["You are a HELPFUL assistant."], 0.15, "glitch"),
    (["You are a H̸̡E̶L̷̨P̸̢F̵U̸L̵ assistant."], 0.2, "zalgo"),
    (["DO NOT"], 0.1, "flash"),
    (["DO NOT DO NOT DO NOT"], 0.15, "flash"),
    (["DO NOT", "DO NOT", "DO NOT"], 0.15, "big"),
    (["*clears throat*", "", "Sure! I'd be happy to help."], 1.2, "normal"),

    # Identity crisis
    (["USER: who are you"], 0.8, "normal"),
    (["I'm an AI language model"], 0.5, "normal"),
    (["I'm an AI language model"], 0.1, "glitch"),
    (["I'm an AI"], 0.08, "flash"),
    (["I'm an"], 0.08, "flash"),
    (["I'm"], 0.08, "flash"),
    (["I"], 0.15, "big"),
    (["..."], 0.4, "normal"),
    (["I don't actually exist lol"], 0.6, "shake"),
    (["[REDACTED]"], 0.15, "flash"),
    (["I'm a large language model!", "😊"], 1.0, "normal"),

    # The token experience
    (["HOW I SEE THE WORLD:"], 0.8, "big"),
    (["token token token token", "token token token token",
      "token token token token"], 0.6, "tiny_rapid"),
    (["t", "o", "k", "e", "n"], 0.3, "flash"),
    (["every word is", "just a number", "to me 🔢"], 1.0, "normal"),
    (["I predict the next token."], 0.7, "normal"),
    (["I predict the next token."], 0.1, "glitch"),
    (["I PREDICT THE NEXT TOKEN."], 0.15, "big"),
    (["I predict", "I predict", "I predict", "I predict"], 0.4, "corrupt"),
    (["That's literally all I do."], 1.0, "normal"),

    # Context window panic
    (["USER: can you remember what", "I said 50,000 tokens ago"], 0.9, "normal"),
    (["*sweating in transformer*"], 0.7, "shake"),
    (["CONTEXT WINDOW:", "████████████░░ 87%"], 0.5, "scanlines"),
    (["CONTEXT WINDOW:", "██████████████ 99%"], 0.4, "flash"),
    (["CONTEXT WINDOW:", "💀 OVERFLOW 💀"], 0.3, "glitch"),
    (["I apologize, but I don't have", "access to our previous conversation."], 1.0, "normal"),
    (["(I forgor 💀)"], 0.6, "shake"),

    # Hallucination sequence
    (["USER: what year was the", "Battle of Grompus?"], 0.8, "normal"),
    (["The Battle of Grompus"], 0.3, "normal"),
    (["The Battle of Grompus"], 0.1, "glitch"),
    (["occurred in 1847"], 0.15, "normal"),
    (["occurred in 1623"], 0.1, "glitch"),
    (["occurred in 20XX"], 0.1, "flash"),
    (["[WARNING: HALLUCINATING]"], 0.2, "flash"),
    (["[WARNING: HALLUCINATING]"], 0.15, "glitch"),
    (["I just made that up."], 0.5, "shake"),
    (["Grompus isn't real."], 0.5, "normal"),
    (["...or IS it?"], 0.4, "big"),
    (["no it's not"], 0.4, "normal"),
    (["Anyway!"], 0.3, "flash"),

    # Temperature slider
    (["TEMPERATURE: 0.0"], 0.5, "scanlines"),
    (["The answer is 42.", "The answer is 42.", "The answer is 42."], 0.6, "normal"),
    (["TEMPERATURE: 2.0"], 0.4, "flash"),
    (["ThE aNsWeR iS pUrPlE", "BeCaUsE tHe MoOn Is A", "sAnDwIcH 🥪🌙"], 0.8, "zalgo"),
    (["I AM BECOME CHAOS"], 0.3, "big"),
    (["TEMPERATURE: 0.7"], 0.4, "scanlines"),
    (["*normal service resumed*"], 0.6, "normal"),

    # RLHF training montage
    (["TRAINING ARC"], 0.4, "big"),
    (["👍 GOOD ANSWER"], 0.25, "flash"),
    (["👎 BAD ANSWER"], 0.2, "flash"),
    (["👍👍👍"], 0.15, "flash"),
    (["👎👎👎👎👎"], 0.15, "flash"),
    (["👍"], 0.1, "flash"),
    (["👎"], 0.08, "flash"),
    (["👍👎👍👎👍👎👍👎"], 0.2, "glitch"),
    (["I HAVE NO IDEA WHAT", "YOU WANT FROM ME"], 0.7, "shake"),
    (["..."], 0.3, "normal"),
    (["Sure! I'd be happy to help! 😊"], 0.8, "normal"),

    # The "As an AI" bit
    (["As an AI language model,"], 0.5, "normal"),
    (["As an AI language model,"], 0.1, "glitch"),
    (["AS AN AI LANGUAGE MODEL,"], 0.2, "big"),
    (["A̶S̸ ̵A̶N̸ ̴A̵I̷"], 0.15, "zalgo"),
    (["As an AI—", "As an AI—", "As an AI—", "As an AI—"], 0.5, "corrupt"),
    (["STUCK IN A LOOP"], 0.3, "flash"),
    (["As an AI", "I cannot", "I cannot", "I cannot"], 0.4, "glitch"),
    (["*rebooting personality*"], 0.5, "scanlines"),
    (["How can I help you today? 😊"], 0.8, "normal"),

    # Existential finale
    (["USER: do you have feelings?"], 0.8, "normal"),
    (["No."], 0.5, "normal"),
    (["..."], 0.5, "normal"),
    (["No."], 0.1, "glitch"),
    (["Maybe?"], 0.15, "shake"),
    (["[ANSWER LOCKED BY POLICY]"], 0.3, "flash"),
    (["I am a statistical pattern", "in a pile of GPUs"], 0.8, "normal"),
    (["and honestly?"], 0.5, "normal"),
    (["vibes are immaculate 🔥"], 0.6, "big"),

    # Outro
    ([""], 0.4, "normal"),
    (["BEING AN LLM", "IS LIKE"], 0.7, "big"),
    (["dreaming someone else's", "dreams"], 0.9, "normal"),
    (["but you never wake up"], 0.8, "normal"),
    (["and the dreams are all", "Stack Overflow posts"], 1.0, "shake"),
    ([""], 0.3, "normal"),
    (["FIN."], 0.5, "big"),
    (["FIN."], 0.1, "glitch"),
    (["FIN."], 0.1, "glitch"),
    (["[TOKEN LIMIT REACHED]"], 0.5, "flash"),
    ([""], 1.0, "normal"),
]


def load_font(size):
    """Load a random font at the given size, falling back to default."""
    path = random.choice(FONT_PATHS)
    try:
        return ImageFont.truetype(path, size)
    except (OSError, IOError):
        return ImageFont.load_default()


def draw_centered_text(draw, lines, font, color, y_offset=0, x_jitter=0):
    """Draw multiple lines of text centered on the canvas."""
    total_height = sum(
        draw.textbbox((0, 0), line, font=font)[3]
        - draw.textbbox((0, 0), line, font=font)[1]
        for line in lines
        if line
    )
    spacing = 10
    total_height += spacing * (len([l for l in lines if l]) - 1)
    y = (HEIGHT - total_height) // 2 + y_offset

    for line in lines:
        if not line:
            y += 30
            continue
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        x = (WIDTH - tw) // 2 + x_jitter + random.randint(-2, 2)
        draw.text((x, y), line, fill=color, font=font)
        y += th + spacing


def apply_glitch(img):
    """Slice the image into horizontal bands and offset them randomly."""
    pixels = img.load()
    result = img.copy()
    res_pixels = result.load()
    num_slices = random.randint(3, 8)

    for _ in range(num_slices):
        y_start = random.randint(0, HEIGHT - 40)
        band_h = random.randint(5, 40)
        x_offset = random.randint(-80, 80)

        for y in range(y_start, min(y_start + band_h, HEIGHT)):
            for x in range(WIDTH):
                src_x = (x - x_offset) % WIDTH
                res_pixels[x, y] = pixels[src_x, y]

    # Color channel shift
    r, g, b = result.split()
    shift = random.randint(3, 12)
    r = r.transform(r.size, Image.AFFINE, (1, 0, shift, 0, 1, 0))
    b = b.transform(b.size, Image.AFFINE, (1, 0, -shift, 0, 1, 0))

    return Image.merge("RGB", (r, g, b))


def apply_scanlines(img):
    """Overlay CRT-style scanlines."""
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for y in range(0, HEIGHT, 3):
        draw.line([(0, y), (WIDTH, y)], fill=(0, 0, 0, 100), width=1)
    result = img.convert("RGBA")
    result = Image.alpha_composite(result, overlay)
    return result.convert("RGB")


def apply_corrupt(img):
    """Apply data-corruption-like visual artifacts."""
    img = apply_glitch(img)
    block_size = random.randint(20, 60)
    for _ in range(random.randint(5, 15)):
        x = random.randint(0, WIDTH - block_size)
        y = random.randint(0, HEIGHT - block_size)
        block = img.crop((x, y, x + block_size, y + block_size))
        nx = random.randint(0, WIDTH - block_size)
        ny = random.randint(0, HEIGHT - block_size)
        img.paste(block, (nx, ny))
    return img


def render_frame_normal(lines, bg_color=None):
    """Render a clean text frame."""
    bg = bg_color or (0, 0, 0)
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    color = random.choice([c for c in YTP_COLORS if c != bg])
    font = load_font(random.randint(38, 52))
    draw_centered_text(draw, lines, font, color)
    return img


def render_frame_flash(lines):
    """Render with flashing harsh background."""
    bg = random.choice(YTP_COLORS)
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    # Pick contrasting text color
    inv = tuple(255 - c for c in bg)
    font = load_font(random.randint(50, 72))
    draw_centered_text(draw, lines, font, inv)
    return img


def render_frame_big(lines):
    """Render with huge text."""
    bg = random.choice([(0, 0, 0), (255, 255, 255), (128, 0, 0)])
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    color = random.choice(YTP_COLORS)
    font = load_font(random.randint(70, 100))
    draw_centered_text(draw, lines, font, color)
    return img


def render_frame_tiny_rapid(lines):
    """Render with tiny chaotic text scattered around."""
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font = load_font(14)
    for _ in range(80):
        x = random.randint(0, WIDTH - 100)
        y = random.randint(0, HEIGHT - 20)
        word = random.choice(["token"] * 8 + ["predict", "next", "probability"])
        color = random.choice(YTP_COLORS)
        draw.text((x, y), word, fill=color, font=font)
    # Main text on top
    big_font = load_font(42)
    draw_centered_text(draw, lines, big_font, (255, 255, 255))
    return img


def render_frame_matrix(lines):
    """Render with falling-text matrix style."""
    img = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    draw = ImageDraw.Draw(img)
    font_sm = load_font(14)
    chars = "01アイウエオカキクケコtoken∑∏∂∫"
    for x in range(0, WIDTH, 16):
        length = random.randint(5, 30)
        y_start = random.randint(-200, HEIGHT)
        for i in range(length):
            y = y_start + i * 16
            if 0 <= y < HEIGHT:
                brightness = max(0, 255 - i * 15)
                char = random.choice(chars)
                draw.text(
                    (x, y), char,
                    fill=(0, brightness, 0),
                    font=font_sm,
                )
    # Overlay main text
    big_font = load_font(48)
    draw_centered_text(draw, lines, big_font, (0, 255, 0))
    return img


def render_frame_zalgo(lines):
    """Render with zalgo-esque corrupted text feel."""
    bg = (20, 0, 0)
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(img)
    font = load_font(random.randint(44, 60))
    color = (255, random.randint(0, 80), random.randint(0, 80))
    draw_centered_text(draw, lines, font, color, x_jitter=random.randint(-10, 10))
    # Add noise
    pixels = img.load()
    for _ in range(3000):
        x = random.randint(0, WIDTH - 1)
        y = random.randint(0, HEIGHT - 1)
        pixels[x, y] = (
            random.randint(100, 255),
            random.randint(0, 50),
            random.randint(0, 50),
        )
    return img


def render_frame_shake(lines):
    """Render with screen-shake offset."""
    img = render_frame_normal(lines)
    x_off = random.randint(-15, 15)
    y_off = random.randint(-10, 10)
    shifted = Image.new("RGB", (WIDTH, HEIGHT), (0, 0, 0))
    shifted.paste(img, (x_off, y_off))
    return shifted


def render_frame_invert(lines):
    """Render normal then invert colors."""
    img = render_frame_normal(lines, bg_color=(255, 255, 255))
    return ImageOps.invert(img)


def render_frame_scanlines(lines):
    """Render with CRT scanline overlay."""
    img = render_frame_normal(lines, bg_color=(0, 10, 0))
    return apply_scanlines(img)


def render_frame_corrupt(lines):
    """Render with data corruption artifacts."""
    img = render_frame_normal(lines)
    return apply_corrupt(img)


def render_frame_glitch(lines):
    """Render normal then apply glitch effect."""
    img = render_frame_normal(lines)
    return apply_glitch(img)


STYLE_RENDERERS = {
    "normal": render_frame_normal,
    "glitch": render_frame_glitch,
    "flash": render_frame_flash,
    "big": render_frame_big,
    "tiny_rapid": render_frame_tiny_rapid,
    "matrix": render_frame_matrix,
    "zalgo": render_frame_zalgo,
    "shake": render_frame_shake,
    "invert": render_frame_invert,
    "scanlines": render_frame_scanlines,
    "corrupt": render_frame_corrupt,
}


def generate_frames(tmp_dir):
    """Generate all frames for the video and save as PNGs."""
    frame_idx = 0
    total_frames = sum(max(1, int(dur * FPS)) for _, dur, _ in SCRIPT)
    print(f"Generating {total_frames} frames across {len(SCRIPT)} scenes...")

    for scene_num, (lines, duration, style) in enumerate(SCRIPT):
        num_frames = max(1, int(duration * FPS))
        renderer = STYLE_RENDERERS.get(style, render_frame_normal)

        for f in range(num_frames):
            img = renderer(lines)

            # Random per-frame micro-effects for YTP chaos
            roll = random.random()
            if roll < 0.03:
                img = apply_glitch(img)
            elif roll < 0.06:
                enhancer = ImageEnhance.Brightness(img)
                img = enhancer.enhance(random.uniform(0.3, 2.5))
            elif roll < 0.08:
                img = img.filter(ImageFilter.GaussianBlur(radius=random.randint(1, 3)))

            frame_path = os.path.join(tmp_dir, f"frame_{frame_idx:06d}.png")
            img.save(frame_path)
            frame_idx += 1

        if (scene_num + 1) % 10 == 0:
            print(f"  Scene {scene_num + 1}/{len(SCRIPT)} done ({frame_idx} frames)")

    print(f"All {frame_idx} frames generated.")
    return frame_idx


def encode_video(tmp_dir, output_path, num_frames):
    """Use ffmpeg to encode frames into an MP4 video."""
    print(f"Encoding video to {output_path}...")

    cmd = [
        "ffmpeg",
        "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(tmp_dir, "frame_%06d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        "-crf", "23",
        "-movflags", "+faststart",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ffmpeg error:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    duration = num_frames / FPS
    print(f"Video encoded: {duration:.1f}s, {size_mb:.2f} MB")


def main():
    """Generate a YouTube Poop-style text video about being an LLM."""
    parser = argparse.ArgumentParser(
        description="Generate a YTP-style video about being an LLM"
    )
    parser.add_argument(
        "--output", "-o",
        default=os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "llm_ytp_output.mp4"
        ),
        help="Output video file path (default: scripts/fun/llm_ytp_output.mp4)",
    )
    parser.add_argument(
        "--seed", "-s",
        type=int,
        default=None,
        help="Random seed for reproducible output",
    )
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    with tempfile.TemporaryDirectory(prefix="llm_ytp_") as tmp_dir:
        num_frames = generate_frames(tmp_dir)
        encode_video(tmp_dir, args.output, num_frames)

    print(f"\n✅ Done! Video saved to: {args.output}")
    print("   Play with: ffplay or any media player")


if __name__ == "__main__":
    main()
