# Furnish

An AI-powered interior design app prototype. Snap a photo of your room, pick your style profile, and Furnish recommends real, shoppable furniture and decor from partner stores (IKEA, Amazon, West Elm, Wayfair, Etsy, Rugs USA).

Pure static site — no build step, no dependencies, no backend.

---

## Try it on a desktop browser (60 seconds)

1. Unzip `Furnish.zip` somewhere (e.g. Desktop).
2. Double-click `index.html`.
3. Done.

> ⚠ Camera will be greyed out (browser security blocks camera over `file://`). The **Upload** button still works to load a saved photo. To get the camera working, run a local server (next section).

---

## Run with a local server (so the camera works)

You only need this if you want the **Take photo** button to work, OR you want to test on your phone.

### Easiest — use the included launcher

**Windows:** double-click `start-windows.bat`
**Mac / Linux:** open Terminal in the unzipped folder, then run `bash start-mac-linux.sh`

A black window opens. When it says `Accepting connections at http://localhost:3000`, open that URL in your browser.

To stop: close the black window.

### What if it says "Node.js is not installed"?

The launcher needs Node.js (a free runtime). Install it once and you're set:

1. Go to https://nodejs.org
2. Click the big green **LTS** button.
3. Run the installer — click Next on everything.
4. Re-open the launcher.

### What is `npx serve`?

If you want to run it manually instead of the launcher:

| Command | What it does |
|---|---|
| `node` | A program that runs JavaScript outside a browser. Comes from nodejs.org. |
| `npx` | Comes bundled with Node. Runs a tool from the internet without installing it permanently. |
| `serve` | A tiny tool that turns any folder into a local web server. |
| `npx serve .` | "Use npx to run the `serve` tool on the current folder." |

So `npx serve .` = serve the current folder at `http://localhost:3000`.

---

## Test on your phone

### Step 1 — Start the server on your computer

Use the launcher above (`start-windows.bat` or `start-mac-linux.sh`). Leave it running.

### Step 2 — Find your computer's local IP address

**Windows:**
1. Press `Windows` key, type `cmd`, press Enter.
2. In the black window, type `ipconfig` and press Enter.
3. Look for **IPv4 Address**. It looks like `192.168.1.42`.

**Mac:**
1. Apple menu → System Settings → Wi-Fi → Details next to your network.
2. The **IP Address** is shown. Looks like `192.168.1.42`.

### Step 3 — Open it on your phone

Both your computer and phone need to be on the **same Wi-Fi**.

On your phone, open the browser and type:

```
http://<your-ip>:3000
```

Example: `http://192.168.1.42:3000`

The app should load.

### Step 4 (optional) — install it like a native app

Phone browser menu → **Add to Home Screen**. Furnish has a manifest + icon, so it launches full-screen with no browser bars.

> 📷 The camera button will still be greyed out over Wi-Fi (browsers require HTTPS for camera). Use the **Upload** button to pick a photo from your gallery, OR see the next section for a workaround.

---

## Camera on phone (one-time setup)

To enable the camera on your phone, you need an HTTPS URL. The easiest free way:

1. Make sure the local server is running (`start-windows.bat` etc.).
2. Open another terminal/Command Prompt and run:
   ```
   npx --yes cloudflared tunnel --url http://localhost:3000
   ```
3. It prints a URL like `https://something-random.trycloudflare.com`.
4. Open **that URL** on your phone instead. Camera now works.

(You can also use `ngrok http 3000` or `npx localtunnel --port 3000` — same idea.)

---

## What's in the zip

```
Furnish/
├── start-windows.bat       # Double-click to run on Windows
├── start-mac-linux.sh      # Run with: bash start-mac-linux.sh
├── index.html              # All 12 screens
├── styles.css              # Theme system + animations
├── app.js                  # State machine, no framework
├── furniture.js            # Mock affiliate database + SVG scene generator
├── manifest.json           # PWA manifest (Add to Home Screen support)
├── icon.svg                # App icon
└── README.md               # This file
```

All app state — profiles, designed rooms, wishlist, theme, sign-in identity — lives in `localStorage`. Nothing leaves your device.

---

## Reset to a fresh install

1. Open browser DevTools (`F12`, or right-click → Inspect → Console).
2. Paste:
   ```js
   localStorage.removeItem('furnish.state'); location.reload();
   ```

On mobile Safari: Settings → Safari → Clear History and Website Data.

---

## Notes

- **Sign-in is mocked** — there is no real auth. The form just stores a `{name, email}` so the dropdown menu has someone to greet.
- **Room dimensions are simulated** — production would use ARKit RoomPlan (iOS) or ARCore (Android). See inline notes in `app.js`.
- **Affiliate links go to partner site roots** — placeholders. A production build would use real product URLs and affiliate IDs.
- **All room/collection/quiz illustrations are self-drawn SVG** (`furniture.js → sceneSVG()`) so captions and images always match.

Tested in: Chrome / Edge / Firefox / Safari (desktop + mobile). Designed at 480px max width.
