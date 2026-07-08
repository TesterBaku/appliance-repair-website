#!/usr/bin/env python3
"""Add 'Long Beach, CA' to the areaServed array in all HTML files.

One-off for Phase 3 Long Beach city hub (2026-07-08).
Inserts "Long Beach, CA" alphabetically in the LA County block:
  "Downey, CA","Montebello, CA" → "Downey, CA","Long Beach, CA","Montebello, CA"
"""
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD = '"Downey, CA","Montebello, CA"'
NEW = '"Downey, CA","Long Beach, CA","Montebello, CA"'

count = 0
for root, dirs, files in os.walk(REPO_ROOT):
    # Skip non-HTML directories
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', 'pagefind', 'images', 'data', 'test', 'logs')]
    for fname in files:
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        if OLD not in content:
            continue
        content = content.replace(OLD, NEW)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"  UPDATED: {os.path.relpath(fpath, REPO_ROOT)}")

print(f"\nDone. {count} files updated.")
