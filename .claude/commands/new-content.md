# Create New Content

Scaffold a new article or page based on user input.

## Ask the user for (if not already provided):
- **Type**: article or page
- **Title**: the page/article title
- **Slug**: filename without `.html` (e.g., `article-dishwasher-repair`)
- **Summary**: 1–2 sentence description of the content
- **Topic keywords**: to guide the body content

## Steps

1. **For an article**: copy the structure from `article-fridge-maintenance.html` as the template.
   - Replace title, meta description, hero heading, and body content
   - Keep the same nav, footer, and shared.css link
   - Use `placehold.co` for any images until real ones are provided
   - Add it to the blog listing in `blog.html` (append a new card)

2. **For a page**: copy the structure from the most similar existing page.
   - Add it to the nav in `index.html` and all other pages

3. **Branch**: create a new branch `content/<slug>` before making changes.

4. **After creating the file**:
   - Confirm the file was created at the correct path
   - List what was changed (new file + any files updated like `blog.html`)
   - Suggest running `/test` to verify no broken links
