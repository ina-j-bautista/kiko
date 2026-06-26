# KIKO 🐋

### Bawat Aral, Bagong Tuklas

An offline-first adaptive learning companion for Filipino Grade 1–3 learners. Built for ACM TechSprint Hackathon — Case 2.

**Group 3CS**
Sabrina J. Bautista · Genro Gabriel D. Baldemoro · Jacqueline E. Imperial · Christian Jude J. Bermejo

---

## What it does

KIKO teaches Math, English, and Science to Grade 1–3 Filipino learners through a gamified checkpoint path. When the device has WiFi, it syncs performance data and uses the Gemini AI to generate personalized supplementary exercises. When offline, everything already downloaded continues to work normally.

---

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Frontend        | React 18 + Vite                        |
| AI Generation   | Google Gemini 1.5 Flash (free tier)    |
| Offline Storage | Browser localStorage                   |
| Content System  | JSON modules + Vite `import.meta.glob` |
| Deployment      | Vercel (static)                        |

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A free Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## Installation

**1. Clone or download the project**

```bash
git clone https://github.com/your-username/kiko-app.git
cd kiko-app
```

Or if you downloaded a zip, extract it and open the folder in your terminal.

**2. Install dependencies**

```bash
npm install
```

**3. Add your assets**

Place the following image files in the `/public` folder:

```
public/
  kiko-logo.png       KIKO block-letter logo
  kiko-whale.png      Kiko the Butanding illustration
  kiko-k.png          K icon for the nav button
  bg-home.png         Splash screen background
  bg-subjects.png     Subject select background
  bg-path.png         Lesson path background
  bg-lesson.png       Lesson and quiz background
  starfish.png        Starfish overlay (lesson header)
  jellyfish.png       Jellyfish decoration (splash screen)
```

**4. Add lesson content**

Place lesson JSON files in `src/content/lessons/`. Use `_TEMPLATE.json` as your starting point. See `src/content/SCHEMA.md` for the full field reference.

```
src/content/lessons/
  math-1-1.json
  math-1-2.json
  math-ms-1.json      mastery test
  english-1-1.json
  science-1-1.json
```

Naming convention is flexible — the loader reads stage and lesson number from the `id` field inside the JSON, not the filename.

**5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Adding New Lessons

1. Copy `src/content/lessons/_TEMPLATE.json`
2. Rename it (e.g. `math-1-4.json`)
3. Fill in `id`, `subject`, `type`, `title`, `slides`, and `checks`
4. Save — the lesson appears on the path map automatically

Lesson ordering on the map is determined by the `id` field:

- `"1.1"` → Stage 1, Lesson 1 (bottom of map)
- `"1.5"` → Stage 1, Lesson 5
- `"ms1"` → Mastery Test for Stage 1 (always after all `1.x` lessons)
- `"2.1"` → Stage 2, Lesson 1 (always after `ms1`)

No coordinates or order fields needed.

---

## Using the AI Sync

1. Open the K menu (top-left button on any screen)
2. Paste your Gemini API key into the field — get one free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
3. Tap **I-download at Gumawa ng Materials**
4. The AI generates 3 personalized exercises based on the student's weak areas
5. They appear in **Mga Naka-download** and are available offline after sync

The key is saved to localStorage so you only need to enter it once.

---

## Admin Panel

Access via K menu → **Mga Setting (Admin)**

PIN: `1234`

The admin panel shows:

- Per-lesson scores and weak area flags
- AI generation preview (what will be generated on next sync)
- Parental controls (time limit, language, difficulty)
- Offline mode simulator toggle
- Reset progress

---

## Testing Offline Mode

**Option 1 — Chrome DevTools (most realistic)**

1. Open DevTools (`F12`)
2. Go to the **Network** tab
3. Set throttling to **Offline**
4. All lesson content and downloaded materials still work; sync is disabled

**Option 2 — In-app toggle**
Admin Panel → Kontrol tab → Offline Mode Simulator

This shows the offline UI indicators without actually blocking the network.

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

For subsequent deploys:

```bash
vercel --prod
```

No configuration needed. Vite produces a static build that Vercel serves for free. The Gemini API key is entered by users at runtime inside the app — nothing sensitive is in the build.

---

## Project Structure

```
kiko-app/
  public/
    kiko-logo.png
    kiko-whale.png
    kiko-k.png
    bg-home.png
    bg-subjects.png
    bg-path.png
    bg-lesson.png
    starfish.png
    jellyfish.png
  src/
    App.jsx               main application
    content/
      loader.js           auto-imports all lesson JSON files
      SCHEMA.md           lesson JSON field reference
      lessons/
        _TEMPLATE.json          lesson template
        _TEMPLATE_MASTERY.json  mastery test template
        math-1-1.json           your lesson files go here
        ...
  package.json
  vite.config.js
```

---

## Lesson JSON Quick Reference

```json
{
  "id": "1.4",
  "subject": "math",
  "type": "lesson",
  "title": "Lesson title",
  "slides": [
    {
      "header": "ARALIN 1.4",
      "title": "Slide title",
      "body": "Explanation text.",
      "visual": {
        "type": "count-demo",
        "emoji": "🐟",
        "count": 6,
        "label": "Anim! (6) 🎉"
      }
    }
  ],
  "checks": [
    {
      "q": "Ilan ang mga isda?",
      "emoji": "🐟",
      "count": 6,
      "opts": [4, 5, 6, 7],
      "ans": 6
    }
  ],
  "passThreshold": 2
}
```

Visual types: `sequence` (numbered emoji list) or `count-demo` (emoji grid with reveal label).
Check `opts` must contain exactly 4 numbers in ascending order including `ans`.
All question text (`q`) should be in Filipino.

---

## License

Built for ACM TechSprint 2026 · Group 3CS · FEU Institute of Technology

## Use of AI

**Claude (Anthropic)** — Ideation and programming assistance for MVP development, including architecture design, component implementation, and iterative debugging throughout the build process.

**ChatGPT (OpenAI)** — Ideation and early concept development.

All visual assets, character illustrations, and artwork were created by the team members.
