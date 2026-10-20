# Connected Commons: legal pages, hosting and cookie consent

Files in this folder (all static, no build step):

| File | Goes to | Live URL |
|---|---|---|
| `privacy-policy.html` | repo root | connectedcommons.co/privacy-policy |
| `terms-of-use.html` | repo root | connectedcommons.co/terms-of-use |
| `cookie-policy.html` | repo root | connectedcommons.co/cookie-policy |
| `legal.css` | repo root | shared styling |
| `cookie-consent.js` | repo root | consent banner and settings |

## Part 1. Fill the placeholders (do this before publishing)

Search each page for `[` to find them all:

- `[OPERATOR NAME ...]`: Connected Commons is not registered yet. Use your own name as the trading party for now and replace it when you register. Note that trading under a business name in Singapore normally needs registering with ACRA, so check that with your accountant or a corporate services partner.
- `[DATE]`: the day you publish.
- `[BUSINESS PHONE NUMBER]` and `[BUSINESS ADDRESS IN SINGAPORE]`: the PDPA expects a contact point for data protection queries. A registered office or a virtual office address works.
- `[NAME OF CHATBOT PROVIDER]` and `[ANALYTICS TOOL]`: name what you actually use. If you use no analytics, delete that row and that bullet.
- Retention periods in square brackets (24 months, 12 months, 5 years): adjust to what you will really do.
- Contact email is set to `hello@connectedcommons.co`. Change it if you prefer `contact@`.

Rule: these pages must describe what the site really does. If you add a tool later (analytics, a new form, a CRM), update the policy the same day.

## Part 2. Publish through GitHub (Vercel deploys automatically)

1. Open your website repo on GitHub.
2. Click **Add file > Upload files**, drag in all 5 files, keep them in the repo root next to `index.html`, then **Commit changes** to the main branch.
3. Vercel builds within about a minute. Check the deployment goes green in your Vercel dashboard.
4. Make the short URLs work. Without this setting, `/privacy-policy` returns 404 and only `/privacy-policy.html` works. Add a `vercel.json` in the repo root (if one already exists, just add the `cleanUrls` line to it):

```json
{ "cleanUrls": true }
```

5. Open each page on the live domain and test: link works, styling loads, banner appears.

Do not upload a full copy of `index.html` from here. Edit it directly in GitHub (pencil icon) so you do not overwrite the email capture code.

## Part 3. Connect the footer links in index.html

In GitHub, open `index.html`, press the pencil icon, and use Ctrl+F for `href="#"`.

Change:
```html
<a href="#">Privacy Policy</a>   ->   <a href="/privacy-policy">Privacy Policy</a>
<a href="#">Terms of Use</a>     ->   <a href="/terms-of-use">Terms of Use</a>
```
Add a Cookie Policy link and a settings link next to them:
```html
<a href="/cookie-policy">Cookie Policy</a>
<a href="#" data-cc-open-preferences>Cookie settings</a>
```
Disclaimer, Engagement Terms, FAQ, Who we work with, LinkedIn, Twitter/X: not covered here. Until those pages exist, delete those links (or hide them) rather than leaving dead `#` links. Engagement Terms should be a signed client agreement, not a web page, so drafting it needs a lawyer.

Then add this one line just before `</body>` in `index.html`:
```html
<script src="/cookie-consent.js" defer></script>
```

If your main page does not already load Figtree, the legal pages load it from Google Fonts. Your site may host the font itself; if so, point `legal.css` to that instead (this is also better for privacy because it avoids a Google Fonts request).

## Part 4. Add a privacy notice to the email capture

Under the email field or button in `index.html`, add:
```html
<p class="form-note">By submitting, you agree we may contact you about Connected Commons services. See our <a href="/privacy-policy">Privacy Policy</a>. You can unsubscribe at any time.</p>
```
This gives the notice and purpose the PDPA expects. If you send marketing emails to the list, also include an unsubscribe line in each email.

## Part 5. Check cookie consent on the live site

Run this once the pages are live (Chrome: right-click the page, **Inspect**).

1. **Fresh visit.** Open the site in an Incognito window. A banner should appear with Accept, Reject and Customise at equal prominence.
2. **Before choosing anything**: DevTools > **Application** tab > **Cookies** and **Local Storage**. Only `cc_consent` may exist after you click. Before you click, expect no analytics cookies (`_ga`, `_gid`, `_fbp`, `hjSession`, and similar) and no chatbot cookies. In the **Network** tab, no requests to googletagmanager, google-analytics, facebook, hotjar or your chatbot's domain should fire.
3. **Click Reject non-essential.** Reload. Still no optional cookies or tracker requests. Banner stays away.
4. **Clear site data, click Accept all.** Now analytics and chatbot may load. Confirm the cookies match the table in your Cookie Policy.
5. **Withdraw.** Click "Cookie settings" in the footer, turn analytics off, save. The `_ga` cookies should disappear and not return after reload.
6. **Mobile.** Check the banner on a phone: all buttons reachable, nothing covers the WhatsApp or booking buttons.
7. **Every page.** Repeat step 1 on the legal pages, since they load the same script.

### Gate your existing third-party scripts

Anything that sets cookies (analytics, chatbot, embeds) must be switched from running immediately to waiting for consent. Change:
```html
<script src="https://analytics.example.com/script.js"></script>
```
to:
```html
<script type="text/plain" data-cc-category="analytics" src="https://analytics.example.com/script.js"></script>
```
Use `data-cc-category="functional"` for the chatbot and embedded content. Inline snippets work the same way.

Things that usually do NOT need the banner, but still need to be in the Privacy Policy: your Google Sheet email capture (the visitor submits it knowingly), the WhatsApp and Google Calendar booking links (they leave your site), and Vercel's server logs.

If you use Vercel Analytics, Plausible or Fathom without cookies or personal identifiers, you may be able to treat them as essential. Even so, listing them in the Cookie Policy is the safe route.

## Part 6. Keep it maintained

- Change a tool, form or partner: update Privacy Policy and Cookie Policy, change the date.
- Register the company: replace the operator name on all three pages and add the UEN to the footer.
- Add paid services online or take payments through the site: you will need payment, refund and cancellation terms, and a lawyer should review them.

## Important: have these reviewed

These pages are well-structured drafts built around Singapore's PDPA and how your site actually works, but I am not a lawyer. Before your first paying client, get a Singapore lawyer to review them. A short review of three standard pages is typically a small fixed-fee job. Cookie banners are not mandated by the PDPA itself, but consent for analytics is good practice and effectively required for visitors from the EU, UK and Indonesia, so keeping it is worth it.
