# The Tribe Studio: Google visibility audit and changes

Site: https://d9ypvyrbm2-sketch.github.io/tribe-studio/ (GitHub Pages, served from `main`, repository root).
Branch with the changes: `claude/google-visibility-seo`. Nothing is merged or deployed. Audit date: 4 November 2026.

Status key: **COMPLETE**, **NEEDS OWNER ACTION**, **BLOCKED**, **NOT APPLICABLE**.

## 1. Initial audit (before changes)

| # | Check | Finding on `main` | Status after this branch |
|---|-------|-------------------|--------------------------|
| 1 | Robots meta | `<meta name="robots" content="noindex, nofollow">` in `index.html` line 9, under the comment "TEST SITE: keep out of search engines until Jean approves publishing". It is the only source: no `X-Robots-Tag`, no other page, no build step. | COMPLETE: now `index, follow, max-image-preview:large`. Takes effect only when merged. |
| 2 | robots.txt | None in the repo. For a GitHub Pages *project* site, crawlers only read `https://d9ypvyrbm2-sketch.github.io/robots.txt` (the user-site repo `d9ypvyrbm2-sketch.github.io`), which returned an error when fetched, so nothing blocks crawling. | COMPLETE: `robots.txt` added (allows all, names the sitemap). See note in section 5. |
| 3 | noindex / nofollow | Only the tag above. | COMPLETE |
| 4 | Canonical URL | Missing. | COMPLETE: `<link rel="canonical" href="https://d9ypvyrbm2-sketch.github.io/tribe-studio/">`, plus `og:url`. |
| 5 | Title | "The Tribe Studio 1 Maverick \| Barbershop in East Boston" | COMPLETE: "The Tribe Studio \| Barbershop in East Boston, MA" (ES: "The Tribe Studio \| Barbería en East Boston, MA"). |
| 6 | Meta description | Present, mentioned the Booksy rating. | COMPLETE: the description from the brief, EN and ES. |
| 7 | Headings | One `h1` (hero). The four chair "station" dialogs each have an `h2` placed before the `h1` in source order; they are hidden dialogs, so this is minor and was left alone to protect the design. | COMPLETE (no change needed) |
| 8 | Image ALT | No `<img>` elements at all: every photo was a CSS background, and the hero and gallery were "Shop photo here" placeholders. | COMPLETE: four real photos added as `<img>` with descriptive EN and ES alt text. |
| 9 | Broken images / assets | None. All six JPEGs in `img/` load (verified in a headless browser, no 4xx). | COMPLETE |
| 10 | Mobile | Responsive, no horizontal scroll at 390 px. | COMPLETE: still no horizontal scroll (checked at 390 px and 1366 px). |
| 11 | Performance | Six 1200x1600 JPEGs (150 to 290 KB each) used as CSS backgrounds; two preloaded. Google Fonts render-blocking stylesheet. | COMPLETE: WebP versions (about 30 to 40% smaller) with responsive sizes. Fonts left as they are (design). |
| 12 | Internal links | All `#` anchors resolve except `#inside`, which is handled by `shop.js` (opens the shop view); unchanged from `main`. | COMPLETE |
| 13 | Duplicate content | One page. EN and ES share one URL (language switches in JavaScript), so there are no duplicate URLs. | NOT APPLICABLE |
| 14 | Sitemap | None. | COMPLETE: `sitemap.xml` added. |
| 15 | Structured data | `HairSalon` JSON-LD with name, address, hours, price range, Instagram, Booksy. Invalid property `availableLanguage` on a business. No phone, image or services. | COMPLETE: rebuilt and validated (section 4). |

Other findings:

* The footer said "Test site — not the official website of The Tribe Studio, and not affiliated with the shop or with Booksy." A page saying that cannot be the shop's Google listing, so this branch removes it. **Merging this branch is what turns the test site into the public, official site. That needs the shop owner's OK.**
* The phone number did not appear anywhere on the site. It is now in the Visit section (a "Call (857) 334-9508" button) and the footer, as `tel:` links.
* The Booksy review count was out of date (424 on the site, 456 on Booksy on 4 Nov 2026). Updated to 456.

## 2. Problems found, and what was done

1. Site blocked from Google by `noindex, nofollow`: fixed in the branch.
2. "Test site / not official" disclaimer in the footer (EN and ES): removed in the branch.
3. No canonical URL, no `og:url`, no `og:image`: added.
4. No phone number on the site: added.
5. Placeholder boxes instead of photos in the hero and gallery: replaced with the real shop photos already in the repo.
6. No `<img>` elements, so Google Images had nothing to index: four added, with alt text.
7. Invalid `availableLanguage` on the business in JSON-LD: replaced with `knowsLanguage`.
8. No sitemap: added.
9. Stale Booksy review count: updated.
10. **Opening hours conflict (not fixed, owner must confirm):** the site and Booksy say Mon to Sat 9 AM to 9 PM and Sun 10 AM to 6 PM (Booksy showed 9 AM to 9 PM for Tuesday 3 Nov). The sign on the shop door in `img/storefront.jpg` says "Tuesday to Sunday 8:00AM to 8:00PM". One of them is out of date.

## 3. Files changed

| File | Change |
|------|--------|
| `index.html` | Title, description, robots, canonical, Open Graph, Search Console placeholder comment, JSON-LD, hero and services/barbers copy, real photos in hero and gallery, phone links, footer disclaimer removed, webp references |
| `main.js` | Spanish strings for all the new or changed text, image alt text in Spanish, removed unused placeholder strings |
| `styles.css` | Styles for photos inside the photo frames and the footer phone link; removed the test-note style |
| `entrance.css`, `shop.css` | Background photos point to the WebP versions |
| `entrance.js`, `shop.js` | Header comment only ("test site" wording) |
| `robots.txt` | New |
| `sitemap.xml` | New |
| `img/*.webp` | New WebP files (descriptive names, 480 px, 800 px and 1200 px widths). Original JPEGs kept for link previews and structured data. |
| `SEO-REPORT.md` | This report |

## 4. Structured data

Type: `HairSalon`. schema.org has no `BarberShop` type (checked against the schema.org vocabulary file), and `HairSalon` is the most specific valid `LocalBusiness` type Google supports. The barbershop wording lives in the name, description and services instead.

Included, all verified:

* Name "The Tribe Studio", `alternateName` "The Tribe Studio 1 Maverick" (the Booksy name).
* Address 55 Chelsea St, East Boston, MA 02128, US (site, Booksy).
* Phone +1-857-334-9508 (from the brief, and printed on the shop door in `img/storefront.jpg`).
* URL: the canonical GitHub Pages URL.
* Images: storefront, interior and a chair station (real photos already on the site).
* Opening hours as on the site and Booksy (see the conflict in section 2).
* Price range, Instagram and Booksy in `sameAs`, a `ReserveAction` pointing to Booksy.
* Services and prices as an `OfferCatalog`, matching Booksy on 4 Nov 2026: Haircut $40, Haircut with Andres $60, Haircut & Beard $50, Haircut & Beard with Andres $70, VIP $70, Line up $25, Hair color from $150.

Deliberately left out:

* `geo` coordinates: none verified. Add them only from the owner's Google Business Profile pin.
* `aggregateRating` and `review`: the 5.0 rating is collected on Booksy, and Google's rules forbid marking up ratings from another site. The Google rating (4.9 from 97) is also not marked up or shown on the site.

Validation: the JSON parses, and every type and property was checked against the schema.org vocabulary (version 29.3); no errors. Google's Rich Results Test could not be reached from the build machine, so run it once after merging (section 6, step 6).

## 5. Sitemap and robots.txt

`sitemap.xml` lists one URL, `https://d9ypvyrbm2-sketch.github.io/tribe-studio/`, with the four photos as image entries. The site is a single page: services, barbers, gallery, reviews and visit/contact are sections of it (`#services` and so on), and search engines ignore `#` fragments, so there are no other real URLs to list. Adding fragment URLs or thin extra pages would go against the brief.

`robots.txt` allows everything and names the sitemap. Because this is a GitHub Pages project site, Google reads robots.txt only at the root of `d9ypvyrbm2-sketch.github.io`, not inside `/tribe-studio/`. So the file has no effect until the site gets its own domain; until then the sitemap is submitted directly in Search Console. Both files were checked: the sitemap is well-formed XML using the standard sitemap and image namespaces.

## 6. Google Search Console setup (owner does this in their own Google account)

1. Merge the branch, then wait for GitHub Pages to redeploy (Actions tab, "pages build and deployment", usually 1 to 2 minutes).
2. Go to https://search.google.com/search-console and choose **Add property**, then **URL prefix**, and enter `https://d9ypvyrbm2-sketch.github.io/tribe-studio/`. (A "Domain" property is not possible on github.io, because it needs DNS access.)
3. Choose the **HTML tag** method. Copy the `<meta name="google-site-verification" ...>` tag Google shows and paste it in `index.html` where the comment "Google Search Console: paste the owner's verification tag here" is. Commit it to `main`, wait for the deploy, then press **Verify**. (No token is in the code: it has to come from the owner's account. There were no existing verification tags to keep.)
4. **Sitemaps**: enter `sitemap.xml` and press **Submit**.
5. **URL inspection**: paste the homepage URL, press **Test live URL**, check "URL is available to Google" and that "Indexing allowed?" says Yes, then press **Request indexing**.
6. Run https://search.google.com/test/rich-results on the homepage URL and check that the LocalBusiness item shows with no errors.
7. Come back after a few days: **Pages** should show the homepage as Indexed.

## 7. Image report

| Photo | What it shows | Used for | Sizes |
|-------|---------------|----------|-------|
| `tribe-studio-barbershop-interior-east-boston` | Interior, hexagon light ceiling, gold chairs | Shop scene, Booksy station, hero photo (loaded with high priority) | 1200 webp 213 KB (jpg was 289 KB); 800 and 480 widths |
| `tribe-studio-storefront-55-chelsea-st` | Entrance with barber pole | Gallery, link previews (jpg) | 184 KB (was 267 KB) |
| `tribe-studio-storefront-entrance-film` | Same entrance, film colour grade | Opening door scene, preloaded | 155 KB (was 278 KB) |
| `tribe-studio-barber-chair-station` | A chair and station | Barbers station, gallery | 105 KB (was 152 KB) |
| `tribe-studio-barber-station-tools` | A barber at work at a station | Services station, gallery | 156 KB (was 221 KB) |
| `tribe-studio-barber-chair-by-door` | A chair by the door | Visit station | 112 KB (was 161 KB) |

Gallery images load lazily; the hero photo and the entrance photo load first. Every `<img>` has width and height to avoid layout shift. No photos were generated or edited beyond resizing and compression.

Still missing (owner to provide): barber portraits, photos of finished haircuts, before-and-after photos. Until then the barbers keep their monogram cards and the gallery shows the shop.

## 8. Business information consistency

| Item | Website | Booksy (4 Nov 2026) | Other source | Status |
|------|---------|---------------------|--------------|--------|
| Name | The Tribe Studio (1 Maverick as subtitle) | The Tribe Studio 1 Maverick | Door sign: THE TRIBE STUDIO | NEEDS OWNER ACTION: confirm which name the Google profile uses, and keep it identical everywhere |
| Address | 55 Chelsea St, East Boston, MA 02128 | Same | Door and number 55 in photo | COMPLETE |
| Phone | (857) 334-9508 | Not shown | Door sign, brief | COMPLETE |
| Hours | Mon to Sat 9 to 9, Sun 10 to 6 | Tuesday 9 to 9 (rest of the week not readable) | Door: Tue to Sun 8 AM to 8 PM | NEEDS OWNER ACTION |
| Booking | Booksy link | Same | | COMPLETE |
| Instagram | @thetribestudiobarbershop | | Instagram blocks automated checks | NEEDS OWNER ACTION: confirm it is the official account |
| Services and prices | 7 services | Match | | COMPLETE |
| Rating | 5.0 from 456 on Booksy, always labelled Booksy | 5.0 from 456 | Google: 4.9 from 97 (from the brief) | COMPLETE: kept separate, Google rating not shown or marked up |

## 9. Google Business Profile recommendations (no changes were made to the profile)

* **Primary category:** Barber shop. **Secondary:** Hair salon; add "Men's hair salon" only if it is offered as a separate category in the profile editor.
* **Name:** keep the real business name exactly as on the door and Booksy. Do not add keywords such as "East Boston Barbershop" to the name.
* **Description (750 characters max), suggestion:** "The Tribe Studio is a barbershop at 55 Chelsea St in East Boston, a short drive from Logan Airport. Our six barbers do men's haircuts, skin and taper fades, haircut and beard grooming, line ups and hair color, in English and Spanish. Book your barber and time online on Booksy."
* **Services:** list the same seven services and prices as the site and Booksy.
* **Booking link:** the Booksy URL. **Website:** the canonical site URL above.
* **Hours:** fix the hours conflict first, then make Google, Booksy, the site and the door sign agree. Add holiday hours.
* **Photos:** the storefront (helps people find the door), interior, each barber at their chair, finished cuts. Real photos only, no stock.
* **Reviews:** reply to every review within a few days, thank people by name, answer complaints calmly and offer to fix things offline. Ask every happy client in person for a review using a QR code at the counter pointing to the review link from the **Ask for reviews** button in the Business Profile. Never pay for reviews or give discounts or gifts for them, and don't filter who gets asked.
* **Consistency:** same name, address and phone on Google, Booksy, Instagram, Yelp, Apple Maps and the site.

## 10. Analytics and monthly reporting

* **Search Console** (free) gives impressions, clicks, CTR, queries, average position and indexed pages.
* **Google Analytics 4:** not installed, because it was not authorized. If you want it, create a GA4 property in your Google account and send the Measurement ID (starts with `G-`); it is one script tag. GA4 "enhanced measurement" counts outbound clicks to Booksy and Google Maps automatically; the phone links already carry `data-track="phone"` so a phone-click event is a small addition. Note that the site would then need a short privacy notice.
* **Google Business Profile Performance** gives calls, direction requests and website clicks from the profile.
* **Core Web Vitals and mobile:** Search Console's Core Web Vitals report (needs some traffic first) and https://pagespeed.web.dev for a manual check each month.

Monthly report template (fill from the tools; no numbers are invented here):

| Metric | Source | This month | Last month | Change |
|--------|--------|-----------|------------|--------|
| Google impressions | Search Console, Performance | | | |
| Organic clicks | Search Console | | | |
| Click-through rate | Search Console | | | |
| Top 10 search queries | Search Console, Queries | | | |
| Average position | Search Console | | | |
| Indexed pages | Search Console, Pages | | | |
| Booking clicks | GA4 outbound clicks to booksy.com, and GBP website clicks | | | |
| Phone clicks | GBP calls, and GA4 phone event if added | | | |
| Direction clicks | GBP directions, and GA4 outbound clicks to Google Maps | | | |

## 11. Owner actions still open

1. **Approve publishing**: merging the branch makes this the public, official site of The Tribe Studio and lets Google index it. The shop owner should be OK with that, because the footer disclaimer goes away.
2. Confirm the real opening hours (site and Booksy vs. the door sign).
3. Confirm the official business name used on the Google profile, and that @thetribestudiobarbershop is the shop's Instagram.
4. Set up Search Console (section 6) and paste the verification tag.
5. Optional: send the map pin coordinates from the Google profile to add `geo` to the structured data.
6. Optional: barber portraits and haircut photos.
7. Optional: authorize GA4 and send the Measurement ID.
8. Make the Google profile changes in section 9 yourself.

## 12. QA results (local, headless Chromium, 1366 px and 390 px)

* Entrance door, walk-in to the shop, chair stations ("Services" opened and closed), "See the full site": all work, same as `main`.
* No JavaScript errors and no failed local requests. (Google Fonts, Maps and other outside hosts were blocked on the test machine, so the map iframe and fonts were not tested.)
* No horizontal scroll on desktop or phone.
* All four `<img>` load; the hero loads eagerly, gallery images lazily.
* EN and ES: title, description, eyebrow, gallery heading, alt text and "Call" button all switch.
* Links: Booksy, Instagram, Google Maps (search and from-airport directions), `tel:+18573349508` and all section anchors are present. The Booksy page was fetched and matches; Instagram blocks automated fetches so it could not be opened from the test machine.
* Robots tag reads `index, follow, max-image-preview:large`; canonical is the production URL.
* JSON-LD: valid against the schema.org vocabulary. sitemap.xml: well-formed. robots.txt: standard syntax.
* Not testable from the build machine: the live site (outbound access to github.io was blocked), Google's Rich Results Test, PageSpeed Insights. Run these after merging.
