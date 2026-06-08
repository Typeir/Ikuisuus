#!/usr/bin/env python3
"""
concat_docs.py - Recursively concatenate text files from a directory into a markdown document.

Usage: python concat_docs.py [root_dir] > output.md
"""

import os
import sys
from pathlib import Path

def get_file_extension(filepath):
    """Return file extension without dot, or 'txt' if none."""
    ext = filepath.suffix.lower().lstrip('.')
    return ext if ext else 'txt'

def process_file(filepath, rel_path):
    """Print a file's markdown block."""
    print(f"## {rel_path.name}")
    ext = get_file_extension(filepath)
    print(f"```{ext}")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            print(f.read().rstrip())
    except Exception as e:
        print(f"<!-- Error reading file: {e} -->")
    print("```")
    print("--------------")

def process_folder(folder_path, indent_level=0, parent_rel=Path('.')):
    """
    Recursively process a folder.
    - indent_level: 0 = root folder (H1), 1 = subfolder (H3)
    - parent_rel: relative path from root for heading display
    """
    folder_rel = parent_rel / folder_path.name if parent_rel != Path('.') else Path(folder_path.name)
    folder_name = folder_path.name

    if indent_level == 0:
        # Root folder: H1 heading
        print(f"# {folder_name}")
    else:
        # Subfolder: H3 heading with "SUB: " prefix
        print(f"### SUB: {folder_name}")

    # Process files in this folder first
    files = [f for f in folder_path.iterdir() if f.is_file()]
    # Sort for consistent output
    for filepath in sorted(files):
        # Skip the script itself if it's inside the folder
        if filepath.name == sys.argv[0]:
            continue
        process_file(filepath, filepath.relative_to(folder_path))

    # Then recurse into subfolders
    subdirs = [d for d in folder_path.iterdir() if d.is_dir()]
    for subdir in sorted(subdirs):
        process_folder(subdir, indent_level + 1, folder_rel)

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    root_path = Path(root).resolve()
    if not root_path.is_dir():
        print(f"Error: '{root}' is not a directory.", file=sys.stderr)
        sys.exit(1)

    # Change to root's parent to compute nice relative paths inside the function
    os.chdir(root_path.parent)
    process_folder(root_path)

if __name__ == "__main__":
    main()