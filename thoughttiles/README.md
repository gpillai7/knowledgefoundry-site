# Knowledge Foundry — Book ThoughtTiles gallery (review branch)

This review branch adds a responsive static gallery under `/thoughttiles/` with 75 catalogue entries, four domains and 12 categories. No edits to the existing homepage or deployment settings.

## Pending image integration

The supplied `knowledgefoundry-btt-prototype.zip` contains optimised WebP images. To finish the gallery, upload its directories `images/thoughttiles/full/` and `images/thoughttiles/thumbnails/` to the same paths in this repository, preserving filenames. This draft PR intentionally does not claim the images are in GitHub yet. Four uncatalogued images should remain staged separately pending editorial review.

The cards display readable placeholders if an image is unavailable. The gallery will automatically show images once uploaded, without code changes.

## Testing

Open `thoughttiles/index.html` from a static web server (e.g. `python -m http.server 8000` from the repository root). Verify domain and category filters, search, deep-link `?id=btt-0001`, lightbox, mouse wheel and keyboard accessibility, desktop and mobile breakpoints, and image loading after upload. Confirm that `/thoughttiles/` works on GitHub Pages before merging.

## Publication

Merge only after image transfer and browser QA; keep `main` unchanged until reviewed.
