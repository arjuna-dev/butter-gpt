# butterGPT

A chrome extension to turn a chat bot into a visual experience using web UI elements.

## Run

1. Install deps: `npm install`
2. Build: `npm run build`
3. Chrome → `chrome://extensions` → enable Developer Mode → “Load unpacked” → select `dist/`
4. Visit ChatGPT web: `https://chatgpt.com/` (or `https://chat.openai.com/`)
5. Open the extension popup to copy the pre‑prompt and optionally set Feedback/Coffee URLs.

## LLM output format (MVP)

Output normal Markdown (no custom HTML/CSS/JS). For interactivity, include these tokens on their own line:

- `[[cta: Button label | What the user would type]]` → inserts into the prompt box
- `[[send: Button label | What the user would type]]` → inserts and sends (only if user enables “Send” in the panel)
- `[[easter: a tiny surprise]]` → a tiny clickable easter egg
