import re, glob, sys

SKIP = {'node_modules', '.git', '.claude', '.agents', '.audits', '.playwright-mcp'}

files = []
for pattern in ['**/*.css', '**/*.html']:
    for f in glob.glob(pattern, recursive=True):
        parts = f.replace('\\', '/').split('/')
        if any(s in parts for s in SKIP):
            continue
        files.append(f)

used = set()
defined = set()

for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fh:
        content = fh.read()
    used.update(re.findall(r'var\((--[a-z0-9-]+)\)', content))
    defined.update(re.findall(r'(--[a-z0-9-]+)\s*:', content))

missing = sorted(used - defined)
print('Used: %d  Defined: %d' % (len(used), len(defined)))
if missing:
    print('UNDEFINED (%d):' % len(missing))
    for m in missing:
        print('  ' + m)
    sys.exit(1)
else:
    print('OK: all CSS variables are defined')
