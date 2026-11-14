# Certify Studio — Certificate Maker

A browser-based certificate designer for GitHub Pages.

## Deploy

1. Extract this folder.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the same folder in your GitHub Pages repository.
3. Commit and push the changes.
4. Hard-refresh the published page (Ctrl + F5) or open it in a private/incognito window to avoid cached older files.

## Features

- Upload an organization logo and sample brand colors.
- Select from five visible background previews in the sidebar or below the live certificate canvas.
- Edit certificate text and drag text elements on the preview.
- Portrait and landscape orientation, preset paper sizes, and custom dimensions in inches.
- Logo and signature images are drawn with proportional `contain` sizing so they are not stretched.
- Two optional signatory names, positions, and signature image uploads.
- Export PNG, JPG, PDF, and a Word-compatible `.doc` document.

## Notes

- All image processing and exports happen in the browser.
- The Word-compatible `.doc` export embeds the finished certificate as an image. It preserves the design, but the text is not separately editable in Word.
- After replacing the files on GitHub Pages, hard-refresh the website to ensure the new JavaScript and CSS are loaded.


## Modern design and logo controls
- Six selectable background styles: Modern minimalist, Luxury gold, Corporate modern, Elegant contemporary, Creative modern, and Silver professional.
- Background thumbnails are shown in the sidebar and below the live certificate preview.
- Use the Logo size slider (25%–250%) to resize the uploaded logo proportionally. The original aspect ratio is preserved; the logo is never stretched.
