Connected Commons website

Upload the contents of this folder to the root of any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3).

index.html                      Landing page
Discovery Offer.dc.html         Offer section, loaded by index.html. Keep it next to index.html.
css/                            Design-system styles and fonts
js/                             Page runtime and design-system bundle
images/                         Logo, favicon, map, pyramid and section images
files/                          Downloadable strategy deck (PDF)

Notes
- Serve the folder over http(s). Opening index.html straight from disk (file://) will not load the offer section.
- React and the Figtree font load from public CDNs, so visitors need an internet connection.
