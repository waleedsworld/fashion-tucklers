# Tucklers Soft Layers 🧥

> Jackets that feel like a hug. A fast, hand-built storefront landing site for **Tucklers Soft Layers** — bombers, puffers, leather and wool, all warmth and no bulk.

No frameworks to install, no build step to babysit, no npm black holes. It's plain **HTML, CSS and vanilla JavaScript** — open it and it just *works*. (We like our stack the way we like our linings: soft and uncomplicated.)

![Tucklers home page](docs/media/home-desktop.png)

---

## ✨ What's inside

- **Five hand-stitched pages** — Home, Products, About, Reviews and Contact, all sharing one consistent header, footer and design language.
- **A real product catalog** — 12 jackets across Leather, Puffer, Denim, Wool and Outerwear, each with its own illustration, price and blurb.
- **Live filter + search** — narrow the rack by category *or* type a name and watch it filter in real time. No page reloads, no waiting.
- **A persistent shopping bag** — tap *Add to Bag* and the counter ticks up, saved to `localStorage` so it survives page hops and refreshes.
- **A validating contact form** — friendly inline errors, a proper email check, and a warm confirmation when everything's in order.
- **Newsletter capture** — the "Layer List" signup validates the address and remembers your subscriber locally.
- **Self-contained artwork** — every jacket is a crisp, hand-authored SVG. No external image hosts, no broken hotlinks, razor-sharp on any screen.
- **Genuinely responsive** — a sticky top nav on desktop that folds into a full-screen slide-out menu on mobile, plus a back-to-top button and toast notifications.

| Products & filters | On your phone |
| --- | --- |
| ![Products page](docs/media/products-desktop.png) | ![Mobile home](docs/media/home-mobile.png) |

Filter the rack by style — here's everything leather:

![Leather filter](docs/media/filter-leather.png)

---

## 🚀 Get it running (yes, even if this is your first repo)

You genuinely don't need Node, npm, or any toolchain. Pick whichever path feels comfy.

### Prerequisites

- A web browser (you already have one — you're reading this).
- *Optional:* [Python 3](https://www.python.org/downloads/) **or** [Node.js](https://nodejs.org/) if you want a tiny local server (recommended, so relative paths and the fonts behave exactly like production).

### Option A — the two-second way

```bash
# 1. Grab the code
git clone https://github.com/waleedsworld/fashion-tucklers.git
cd fashion-tucklers

# 2. Open it
open index.html        # macOS
# or: xdg-open index.html   (Linux)
# or: start index.html      (Windows)
```

That's it. Double-clicking `index.html` in your file explorer works too.

### Option B — with a local server (recommended)

Serving over `http://` (instead of `file://`) makes everything behave just like the live site.

```bash
git clone https://github.com/waleedsworld/fashion-tucklers.git
cd fashion-tucklers

# Python (ships with macOS / most Linux)
python3 -m http.server 5766

# …or Node, if that's more your speed
npx serve .
```

Then open **http://localhost:5766** in your browser. To stop the server, hit `Ctrl + C`.

---

## 🗂️ Project structure

```
fashion-tucklers/
├── index.html          # Home — hero, bestsellers, story, reviews, newsletter
├── products.html       # Full catalog with live filter + search
├── about.html          # Brand story + stats
├── client.html         # Customer reviews
├── contact.html        # Contact cards + validating form + map
├── css/
│   ├── bootstrap.min.css   # Grid + base (vendored)
│   ├── style.css           # Original template styles
│   ├── responsive.css      # Breakpoint tweaks
│   └── tucklers.css        # ← our enhancement layer (palette, cards, forms…)
├── js/
│   ├── jquery.min.js           # Needed only for Bootstrap's carousel
│   ├── bootstrap.bundle.min.js
│   └── tucklers.js             # ← all our behaviour, vanilla, zero trackers
├── images/
│   ├── img-1.svg … img-12.svg  # Hand-authored jacket illustrations
│   ├── hero-jacket.svg, about-jackets.svg
│   └── logo.png, *-icon.png    # Brand + UI icons
└── docs/media/         # Screenshots used in this README
```

Want to add a jacket? Copy a `.col-lg-3` product card in `products.html`, give it a
`data-cat` (one of `leather`, `puffer`, `denim`, `wool`, `outerwear`) and a
`data-name`, and it slots straight into the filter and search — no JS changes needed.

---

## 🎨 Making it yours

Everything visual is tuned from a handful of CSS custom properties at the top of
`css/tucklers.css`:

```css
:root {
  --ink: #1c1917;      /* headings & buttons   */
  --accent: #c8873b;   /* warm copper accent   */
  --paper: #faf7f2;    /* page background      */
}
```

Change `--accent` and the whole site re-skins itself — buttons, tags, hovers, the lot.

---

## 🧰 Built with

Plain **HTML5**, **CSS3** (custom properties, flexbox, grid) and **vanilla JavaScript** —
with Bootstrap's grid and carousel doing some of the heavy lifting. No build tools,
no bundlers, no analytics phoning home. Just honest front-end, made to be lived in.

---

Made with warmth. Now go layer up. 🧣
