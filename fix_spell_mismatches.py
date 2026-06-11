import os
import re
from pathlib import Path

def extract_h1_title(mdx_content):
    """Extract H1 title from MDX file."""
    match = re.search(r'^# (.+)$', mdx_content, re.MULTILINE)
    return match.group(1) if match else None

def extract_blockquote_title(mdx_content):
    """Extract the first line of blockquote (spell name line)."""
    match = re.search(r'> \*\*(.+?)\*\*', mdx_content)
    return match.group(1) if match else None

def title_to_kebab(title):
    """Convert title to kebab-case."""
    return title.lower().replace(' ', '-').replace("'", '')

def build_mismatch_map(spells_dir):
    """Build map of blockquote_title -> correct_filename for mismatches."""
    mismatch_map = {}
    for file in os.listdir(spells_dir):
        if file.endswith('.mdx'):
            spell_id = file[:-4]  # Remove .mdx
            file_path = os.path.join(spells_dir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            h1_title = extract_h1_title(content)
            blockquote_title = extract_blockquote_title(content)
            
            if h1_title and blockquote_title:
                h1_kebab = title_to_kebab(h1_title)
                blockquote_kebab = title_to_kebab(blockquote_title)
                
                # If they don't match, create a replacement mapping
                if h1_kebab != blockquote_kebab:
                    mismatch_map[blockquote_kebab] = spell_id
                    print(f"Mismatch found: {file}")
                    print(f"  H1: {h1_title} ({h1_kebab})")
                    print(f"  Blockquote: {blockquote_title} ({blockquote_kebab})")
                    print(f"  Map: '{blockquote_kebab}' -> '{spell_id}'")
    
    return mismatch_map

def fix_spell_lists(lists_base, mismatch_map):
    """Replace mismatched spell IDs in spell lists."""
    if not mismatch_map:
        print("No mismatches found.")
        return
    
    print(f"\nReplacing in spell lists using map: {mismatch_map}\n")
    
    for root, dirs, files in os.walk(lists_base):
        for file in files:
            if file == 'spells.list.mdx':
                list_path = os.path.join(root, file)
                with open(list_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                modified = content
                replacements = []
                
                for old_spell_id, new_spell_id in mismatch_map.items():
                    old_pattern = f"'{old_spell_id}'"
                    new_pattern = f"'{new_spell_id}'"
                    
                    if old_pattern in modified:
                        count = modified.count(old_pattern)
                        modified = modified.replace(old_pattern, new_pattern)
                        replacements.append((old_spell_id, new_spell_id, count))
                
                if replacements:
                    with open(list_path, 'w', encoding='utf-8') as f:
                        f.write(modified)
                    
                    print(f"Updated: {list_path}")
                    for old_id, new_id, count in replacements:
                        print(f"  Replaced {count}x: '{old_id}' → '{new_id}'")

def fix_spell_blockquotes(spells_dir, mismatch_map):
    """Fix blockquote names in spell files to match H1 titles."""
    if not mismatch_map:
        return
    
    print(f"\nFixing blockquote names in spell files...\n")
    
    for blockquote_kebab, spell_id in mismatch_map.items():
        spell_file = os.path.join(spells_dir, f"{spell_id}.mdx")
        
        if os.path.exists(spell_file):
            with open(spell_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            h1_title = extract_h1_title(content)
            blockquote_title = extract_blockquote_title(content)
            
            if h1_title and blockquote_title and h1_title != blockquote_title:
                # Replace blockquote title with H1 title
                fixed = re.sub(
                    r'(> \*\*)' + re.escape(blockquote_title) + r'(\*\*)',
                    r'\1' + h1_title + r'\2',
                    content,
                    count=1
                )
                
                with open(spell_file, 'w', encoding='utf-8') as f:
                    f.write(fixed)
                
                print(f"Fixed: {spell_id}.mdx")
                print(f"  Blockquote: '{blockquote_title}' → '{h1_title}'")

def main():
    spells_dir = 'src/content/en/spells'
    lists_base = 'src/content/en/character-creation/vocations'
    
    if not os.path.isdir(spells_dir):
        print(f"Spells directory not found: {spells_dir}")
        return
    
    print("="*60)
    print("STEP 1: Building mismatch map")
    print("="*60)
    mismatch_map = build_mismatch_map(spells_dir)
    
    print("\n" + "="*60)
    print("STEP 2: Replacing in spell lists")
    print("="*60)
    fix_spell_lists(lists_base, mismatch_map)
    
    print("\n" + "="*60)
    print("STEP 3: Fixing blockquote names in spell files")
    print("="*60)
    fix_spell_blockquotes(spells_dir, mismatch_map)
    
    print("\n" + "="*60)
    print("Done!")
    print("="*60)

if __name__ == '__main__':
    main()
