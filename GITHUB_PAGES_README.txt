GitHub Pages packaging notes — Mounce BBG variant
=================================================

This zip is ready to upload directly to a GitHub repository configured
for Pages.

Recommended setup:
1. Unzip this package.
2. Commit the contents of the unzipped folder to the repository root.
3. In GitHub, go to Settings > Pages.
4. Set Source to "Deploy from a branch".
5. Choose the branch you committed to and the root folder, then save.

Important details:
- index.html is at the package root; there is no enclosing build folder.
- .nojekyll is included so GitHub Pages serves the static app as-is.
- manifest.json and sw.js use relative/project-safe URLs, so the app works at
  https://username.github.io/repository/ as well as at a custom domain root.
- Vocabulary source is bbg3_all.zip in the repo root (Paul Denisowski's
  BBG3 chapter lists). Grammar concept order follows mounce_overheads.pdf.
