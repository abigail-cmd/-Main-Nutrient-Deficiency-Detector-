# How To Apply This Fix — Step By Step

This guide assumes you know nothing about coding. Every step is written out
in full. Don't skip steps even if they seem obvious.

---

## First — what's in this zip

7 files. Each one is a REPLACEMENT for a file that already exists somewhere
in your project folder. "Replacement" means: you put the new file in the
same spot as the old one, with the exact same name, so it takes the old
one's place. This is sometimes called "overwriting."

The 7 files are:

1. `app.js`
2. `navbar.ejs`
3. `footer.ejs`
4. `result.ejs`
5. `dashboard.ejs`
6. `history.ejs`
7. `output.css`

---

## Step 1 — Unzip this file

Right-click the zip file you downloaded → click "Extract All" → choose
where to put it (your Desktop is fine) → click "Extract."

You'll now have a folder with the 7 files listed above, plus this guide.

---

## Step 2 — Open your project folder

This is the folder you already have, the one with `app.js`, `views`,
`routes`, etc. inside it. Based on what I saw before, it should be at:

```
C:\Users\ABIGAIL\OneDrive\Desktop\VScode\PROJECT\node_deficiency_system
```

Open this folder in File Explorer (not VS Code — just the normal Windows
file browser, so you can drag and drop files).

---

## Step 3 — Replace app.js

1. In your project folder, find the file called `app.js`. It sits directly
   inside the main project folder (not inside any subfolder).
2. Drag the new `app.js` from the unzipped folder into this location.
   Windows will ask "Do you want to replace this file?"
   Click **Yes** / **Replace the file in the destination**.

That's it for this one.

---

## Step 4 — Replace navbar.ejs and footer.ejs

1. Inside your project folder, open the `views` folder.
2. Inside `views`, open the `partials` folder.
3. You'll see `navbar.ejs` and `footer.ejs` already there.
4. Drag the new `navbar.ejs` from the unzipped folder into this `partials`
   folder. Windows will ask to replace — click **Yes**.
5. Do the exact same thing for `footer.ejs`.

---

## Step 5 — Replace result.ejs, dashboard.ejs, history.ejs

1. Go back to your project folder, open the `views` folder (NOT the
   `partials` folder this time — go up one level if you're still inside it).
2. You'll see `result.ejs`, `dashboard.ejs`, and `history.ejs` sitting there.
3. Drag each one from the unzipped folder into this `views` folder, one at
   a time. Click **Yes** to replace each time Windows asks.

---

## Step 6 — Replace output.css

1. In your project folder, open the `public` folder.
2. Inside `public`, open the `css` folder.
3. You'll see `output.css` already there.
4. Drag the new `output.css` from the unzipped folder into this `css`
   folder. Click **Yes** to replace.

---

## Step 7 — Restart your server

1. Open VS Code (or whatever you use to run the project).
2. Open the terminal inside it (if it's not already open: click
   **Terminal** at the top → **New Terminal**).
3. If the server is currently running (you'll see text like
   "Server running on http://localhost:3000" in the terminal), stop it
   first by clicking inside the terminal and pressing **Ctrl + C**.
4. Type this and press Enter:

```
npm start
```

5. Wait for it to say "Server running on http://localhost:3000" again.
6. Open your browser and go to: `http://localhost:3000`

---

## How to know it worked

- The homepage loads without any red error text on the page
- You can click around — Home, About, Start Assessment — without anything
  breaking
- If you log into admin and check the Dashboard and History pages, the
  navigation bar at the top looks the same as it does on the homepage
- On your phone (or by shrinking your browser window very narrow), the
  page rearranges itself nicely instead of looking squashed or cut off

---

## If something still goes wrong

Copy the EXACT red error text that appears — either in your browser or in
the terminal — and send it to me exactly as it appears, including the file
name and line number it mentions. Don't paraphrase it or describe it in
your own words; the exact text is what lets me find the problem fast, the
same way I found the last two.
