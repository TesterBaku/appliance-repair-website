# Create Pull Request

Follow these steps to create a pull request for the current branch:

1. Run `git status` and `git diff main...HEAD --stat` to understand what changed.
2. Read the changed HTML/CSS files to understand the actual modifications.
3. Draft a PR title using Conventional Commits format: `<type>(<scope>): <short description>`
   - Types: `feat`, `fix`, `chore`, `content`, `style`
   - Scope: the page or area changed (e.g., `blog`, `nav`, `services`)
4. Draft the PR body using this structure:
   ```
   ## Summary
   - <bullet points of what changed and why>

   ## Pages / Files Affected
   - <list changed files>

   ## Visual Changes
   - <describe any layout or style changes; note if screenshots should be attached>

   ## Test Checklist
   - [ ] Opened in browser and checked visually
   - [ ] Tested on mobile viewport (375px)
   - [ ] No broken links or missing images
   - [ ] HTML is valid
   ```
5. Run `gh pr create --title "<title>" --body "<body>"` to create the PR.
6. Output the PR URL to the user.

If the branch has no upstream, run `git push -u origin <branch>` first.
