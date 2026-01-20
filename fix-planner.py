import re

# Read file
with open('supabase/functions/chat-stream/planner.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: Remove code blocks with {{IMAGE:}} and replace with inline examples
# Pattern 1: Remove the problematic ```html ... {{IMAGE:...}} ... ``` blocks
content = re.sub(
    r'```html\s*\{\{IMAGE:[^}]+\}\}\s*```',
    r'`{{IMAGE:exemplo}}`',
    content,
    flags=re.MULTILINE | re.DOTALL
)

# Pattern 2: Fix standalone {{IMAGE:}} that are not in backticks
# This finds {{IMAGE:...}} NOT preceded by backtick and wraps it
def wrap_image_placeholder(match):
    full_match = match.group(0)
   
    if full_match.startswith('`'):
        return full_match  # Already escaped
    else:
        return f'`{full_match}`'  # Wrap in backticks

# Only wrap {{IMAGE:}} that appear after "→" (in examples) and are not already wrapped
content = re.sub(
    r'(?<!`)(\{\{IMAGE:[^}]+\}\})(?!`)',
    wrap_image_placeholder,
    content
)

# Write back
with open('supabase/functions/chat-stream/planner.ts', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content)

print("✅ Fixed IMAGE placeholders in planner.ts")
