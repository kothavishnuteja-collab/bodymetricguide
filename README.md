# BodyMetricGuide

A static website with six health and body-measurement calculators. Plain HTML, CSS and JavaScript. No database, no backend, no accounts, no tracking. All calculations run in the visitor's browser.

## What is in this folder

| File / folder | What it is |
|---|---|
| `site.config.js` | **Your settings.** `SITE_URL` (your domain) and `CONTACT_EMAIL`. Edit this first. |
| `src/content.js` | All page text (titles, descriptions, FAQs, legal pages). Edit wording here. |
| `build.js` | Builds the finished website into the `dist/` folder. |
| `assets/css/style.css` | Colours and design (see the `:root` variables at the top). |
| `assets/js/core.js` | The calculation formulas and input checks. |
| `assets/js/app.js` | Calculator buttons, results and the tracker. |
| `serve.js` | Tiny local preview server. |
| `tests/` | Automated checks. |
| `_headers` | Security headers for Cloudflare Pages (copied into `dist/`). If you add ads or analytics later, update its Content-Security-Policy line. |
| `dist/` | The finished site (created by the build). This is what you publish. |

## Pages

Home, Healthy Weight Range, BMI Calculator, Waist-to-Height, Protein Needs, Weight Progress, Body Measurement Tracker, About, Privacy, Terms, Medical Disclaimer, Contact, 404, plus `robots.txt` (and `sitemap.xml` once `SITE_URL` is set).

## Preview on your computer

1. Install Node.js (the LTS version) from https://nodejs.org. Choose the default options.
2. Open a terminal (Windows: "Command Prompt"; Mac: "Terminal") and go to this folder, e.g. `cd path/to/bodymetricguide`.
3. Run `npm start` and open http://localhost:8080 in your browser. Press Ctrl+C to stop.

Do not double-click the HTML files. Use the preview command so links work.

## Build

`npm run build` deletes and recreates the `dist/` folder with every file needed for the website (all pages, `assets/`, `robots.txt`, `404.html`, `_headers`, and `sitemap.xml` once `SITE_URL` is set). There is nothing to install. Publish the contents of `dist/` only.

## Run the tests

- `npm test` runs the formula tests, builds the site and checks all pages and links.
- Optional browser-simulation test: `npm install jsdom --no-save`, then run `node serve.js` in one terminal and `node tests/dom.test.js` in another. This uses a simulated browser, not a real one.

## Publish with Cloudflare Pages and GitHub

1. Create a free account at github.com and make a new repository. Upload all files in this folder (not the `dist/` or `node_modules/` folders).
2. Create a free account at cloudflare.com. Go to **Workers & Pages → Create → Pages → Connect to Git** and select your repository.
3. Use exactly these settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** leave empty (the repository root)
   - No environment variables are needed. The `.node-version` file tells Cloudflare to use Node 22.
4. Click **Save and Deploy**. You get a `*.pages.dev` address.
5. When you have your own domain, add it under **Custom domains**, then put it in `site.config.js` as `SITE_URL` (for example `https://www.yourdomain.com`), upload the change, and Cloudflare rebuilds automatically.

## Before you launch (to do)

- Set `SITE_URL` and `CONTACT_EMAIL` in `site.config.js`. Until then, canonical tags and the sitemap are intentionally left out, and the Contact page says details are not yet published.
- Open every reference link and confirm it still works and says what the page claims. Verified during the build: the NICE NG246 page and the NHS waist-to-height calculator. **Not verified:** the WHO, CDC and NHS BMI/protein links, so check these yourself.
- Have the legal pages (privacy, terms) reviewed. They are plain-language drafts, not legal advice.
- Submit the sitemap in Google Search Console after launch.

## Advertising

Each tool page and the homepage contain an empty, hidden `<aside class="adslot">`. Nothing displays and no ad code is included. Add ad code there only after you are approved, and update the privacy policy first.

## Known limitations

- Tested with automated unit tests and a simulated browser (jsdom). It was **not** tested in real browsers or on real phones; please try it on your own devices.
- Colour contrast and keyboard behaviour were designed for but not audited with a tool such as Lighthouse.
- Tracker data is per browser and does not sync.
- Protein ranges are fixed educational assumptions; edit `PROTEIN` in `assets/js/core.js` to change them.
- Reference links need your manual check (see above).
