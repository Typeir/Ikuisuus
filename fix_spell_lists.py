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

def build_spell_map(spells_dir):
    """Build map of filename -> {h1_title, blockquote_title}."""
    spell_map = {}
    for file in os.listdir(spells_dir):
        if file.endswith('.mdx'):
            spell_id = file[:-4]  # Remove .mdx
            file_path = os.path.join(spells_dir, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            h1_title = extract_h1_title(content)
            blockquote_title = extract_blockquote_title(content)
            spell_map[spell_id] = {
                'h1': h1_title,
                'blockquote': blockquote_title,
                'path': file_path
            }
    return spell_map

def fix_spell_blockquote(file_path, new_title):
    """Fix blockquote spell name in a spell file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the first blockquote title line
    fixed = re.sub(
        r'(> \*\*)[^*]+(\*\*)',
        r'\1' + new_title + r'\2',
        content,
        count=1
    )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed)

def fix_spell_list(list_path, spell_map):
    """Remove missing spells and fix wrong spell names in list."""
    with open(list_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the spells array
    spells_array_match = re.search(r"spells=\{\[\s*(.*?)\s*\]\}", content, re.DOTALL)
    if not spells_array_match:
        return False
    
    spells_str = spells_array_match.group(1)
    spell_ids = re.findall(r"'([^']+)'", spells_str)
    
    removed = []
    fixed = []
    
    for spell_id in spell_ids:
        if spell_id not in spell_map:
            # Spell file doesn't exist, remove from list
            removed.append(spell_id)
        else:
            # Check if blockquote name matches H1 title
            h1_title = spell_map[spell_id]['h1']
            blockquote_title = spell_map[spell_id]['blockquote']
            
            if h1_title and blockquote_title and h1_title != blockquote_title:
                # Fix blockquote name in spell file
                fix_spell_blockquote(spell_map[spell_id]['path'], h1_title)
                fixed.append((spell_id, blockquote_title, h1_title))
            
            # Keep spell in list if it exists
    
    # Remove missing spells from the array
    if removed:
        new_spells_str = spells_str
        for spell_id in removed:
            new_spells_str = re.sub(rf"'({re.escape(spell_id)})',?\s*", '', new_spells_str)
            new_spells_str = re.sub(rf"\s*,?\s*'({re.escape(spell_id)})'", '', new_spells_str)
        
        new_content = content[:spells_array_match.start(1)] + new_spells_str + content[spells_array_match.end(1):]
        
        with open(list_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
    
    return len(removed) > 0 or len(fixed) > 0, removed, fixed

def main():
    spells_dir = 'src/content/en/spells'
    lists_base = 'src/content/en/character-creation/vocations'
    
    if not os.path.isdir(spells_dir):
        print(f"Spells directory not found: {spells_dir}")
        return
    
    # Build map of all spells
    print("Building spell map...")
    spell_map = build_spell_map(spells_dir)
    print(f"Found {len(spell_map)} spells\n")
    
    # Process all spell lists
    for root, dirs, files in os.walk(lists_base):
        for file in files:
            if file == 'spells.list.mdx':
                list_path = os.path.join(root, file)
                print(f"Processing: {list_path}")
                
                changed, removed, fixed = fix_spell_list(list_path, spell_map)
                
                if removed:
                    print(f"  Removed {len(removed)} missing spells: {removed}")
                if fixed:
                    print(f"  Fixed {len(fixed)} blockquote names:")
                    for spell_id, old_name, new_name in fixed:
                        print(f"    {spell_id}: '{old_name}' → '{new_name}'")
                
                if not changed:
                    print(f"  No changes needed")
                print()

if __name__ == '__main__':
    main()
