
import os

index_path = r'c:\Users\HP OMEN 15 GAMING\OneDrive\Desktop\Vibe coding\defi-quest-engine\packages\landing\index.html'
new_hero_path = r'c:\Users\HP OMEN 15 GAMING\OneDrive\Desktop\Vibe coding\defi-quest-engine\packages\landing\new_hero.html'

with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(new_hero_path, 'r', encoding='utf-8') as f:
    new_hero_lines = f.readlines()

# Find markers dynamically
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "HERO SECTION" in line:
        start_idx = i
    if "THE SIMULATION - PROBLEM STATEMENT" in line:
        end_idx = i
        break # Stop at first occurrence after start

if start_idx == -1 or end_idx == -1:
    print(f"ERROR: Could not find markers. Start: {start_idx}, End: {end_idx}")
    # Fallback to hardcoded if not found (debugging)
    # exit(1)

print(f"Found Start at {start_idx}: {lines[start_idx].strip()}")
print(f"Found End at {end_idx}: {lines[end_idx].strip()}")

# Construct new content
final_lines = lines[:start_idx] + new_hero_lines + lines[end_idx:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Successfully updated hero section.")
