# Certify Studio — Logo-Based Certificate Maker

A static certificate designer that runs entirely in the browser and can be hosted free on GitHub Pages.

## Included files
- `index.html` — application structure
- `styles.css` — responsive interface
- `app.js` — logo color sampling, background generation, editor, and exports

## Run locally
1. Download and extract the project.
2. Open `index.html` in a modern browser.
3. Upload a logo, choose a design style, edit the certificate fields, and export.

The PDF library is loaded from a CDN, so PDF export requires an internet connection. PNG/JPG and the editor work locally.

## Publish with GitHub Pages
1. Create a new GitHub repository, for example `certificate-maker`.
2. Upload `index.html`, `styles.css`, and `app.js` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for the deployment and open the published URL shown in the Pages section.

## Features
- Upload PNG, JPG, WEBP, or SVG organization logos.
- Sample dominant colors from the logo using browser canvas.
- Generate elegant, modern, geometric, classic, and creative certificate backgrounds.
- Choose automatic background mode or template-plus-automatic mode.
- Edit certificate wording, organization name, date, and two signatories.
- Drag text on the preview; select an item to change its size and color.
- Choose custom page dimensions in inches or A4, Letter, and Legal landscape presets.
- Export high-resolution PNG, JPG, and PDF.
- No account, backend, API key, or database required.

## Notes
- Custom page dimensions are limited to 3–30 inches per side.
- For best print output, use 300 DPI and check the printer's actual paper settings.
- Uploaded logos and edits are processed in the current browser tab; this starter version does not upload them to a server or save projects between sessions.
- PDF export uses jsPDF from cdnjs. If the CDN is unavailable, PNG/JPG export remains available.
- This is a client-side color extraction and procedural graphic generator, not an AI image-generation service.
