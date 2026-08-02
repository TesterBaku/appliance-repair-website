#!/bin/sh
#
# install-hooks.sh — copy the tracked git hooks into .git/hooks.
#
# Git does not track .git/hooks, so hooks cannot ship with a clone. Run this once
# after cloning (and again after adding a hook to scripts/git-hooks/).
#
#   sh scripts/install-hooks.sh
#
set -e

repo_root=$(git rev-parse --show-toplevel)
src="$repo_root/scripts/git-hooks"
dest="$repo_root/.git/hooks"

if [ ! -d "$src" ]; then
  echo "no scripts/git-hooks directory — nothing to install" >&2
  exit 1
fi

mkdir -p "$dest"
installed=0
for hook in "$src"/*; do
  [ -f "$hook" ] || continue
  name=$(basename "$hook")
  cp "$hook" "$dest/$name"
  chmod +x "$dest/$name"
  echo "installed $name"
  installed=$((installed + 1))
done

echo "$installed hook(s) installed into .git/hooks"
