import { DEFAULT_PREPROMPT } from "../shared/preprompt";
import { DEFAULT_SETTINGS, type Settings } from "../shared/settings";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function showToast(root: HTMLElement, text: string) {
  const toast = root.querySelector<HTMLElement>("[data-toast]");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1600);
}

async function loadSettings(): Promise<Settings> {
  const res = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return res as Settings;
}

async function saveSettings(patch: Partial<Settings>) {
  await chrome.storage.sync.set(patch);
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

function render(root: HTMLElement, settings: Settings) {
  root.innerHTML = "";

  const wrap = el("div", { class: "wrap" });

  const title = el("div", { class: "title" });
  const h1 = el("h1");
  h1.textContent = "butterGPT";
  const tag = el("div", { class: "tag" });
  tag.textContent = "MVP";
  title.append(h1, tag);

  const card1 = el("div", { class: "card" });
  const rowEnabled = el("div", { class: "row" });
  const enabledLabel = el("label");
  enabledLabel.textContent = "Enable on ChatGPT";
  const enabled = el("input") as HTMLInputElement;
  enabled.type = "checkbox";
  enabled.checked = settings.enabled;
  enabled.addEventListener("change", async () => {
    await saveSettings({ enabled: enabled.checked });
    showToast(root, enabled.checked ? "Enabled" : "Disabled");
  });
  rowEnabled.append(enabledLabel, enabled);

  const rowMotion = el("div", { class: "row" });
  const motionLabel = el("label");
  motionLabel.textContent = "Motion intensity";
  const motion = el("input") as HTMLInputElement;
  motion.type = "range";
  motion.min = "0";
  motion.max = "100";
  motion.value = String(settings.motionIntensity);
  motion.addEventListener("input", async () => {
    const v = Number(motion.value);
    await saveSettings({ motionIntensity: v });
  });
  rowMotion.append(motionLabel, motion);

  const rowFallback = el("div", { class: "row" });
  const fallbackLabel = el("label");
  fallbackLabel.textContent = "Show Original tab (fallback)";
  const showFallback = el("input") as HTMLInputElement;
  showFallback.type = "checkbox";
  showFallback.checked = settings.showFallbackTab;
  showFallback.addEventListener("change", async () => {
    await saveSettings({ showFallbackTab: showFallback.checked });
  });
  rowFallback.append(fallbackLabel, showFallback);

  card1.append(rowEnabled, rowMotion, rowFallback);

  const card2 = el("div", { class: "card" });
  const preTitle = el("div", { class: "row" });
  const preLabel = el("label");
  preLabel.textContent = "Pre‑prompt (copy into Custom Instructions)";
  const copyBtn = el("button", { class: "btn primary", type: "button" });
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", async () => {
    await copyToClipboard(DEFAULT_PREPROMPT);
    showToast(root, "Copied pre‑prompt");
  });
  preTitle.append(preLabel, copyBtn);
  const preText = el("textarea") as HTMLTextAreaElement;
  preText.value = DEFAULT_PREPROMPT;
  preText.readOnly = true;
  const small = el("div", { class: "small" });
  small.textContent =
    "butterGPT renders a dark, high‑contrast reading view for assistant messages (updates while streaming) and turns CTA tokens like [[cta: …]] into clickable buttons.";
  card2.append(preTitle, preText, small);

  const card3 = el("div", { class: "card" });
  const rowForms = el("div", { class: "split field" });
  const formsLabel = el("label");
  formsLabel.textContent = "Feedback Google Form iframe URL";
  const formsUrl = el("input") as HTMLInputElement;
  formsUrl.type = "url";
  formsUrl.placeholder = "https://docs.google.com/forms/d/e/.../viewform";
  formsUrl.value = settings.feedbackFormUrl;
  formsUrl.addEventListener("change", async () => {
    await saveSettings({ feedbackFormUrl: formsUrl.value.trim() });
  });
  rowForms.append(formsLabel, formsUrl);

  const rowCoffee = el("div", { class: "split field" });
  const coffeeLabel = el("label");
  coffeeLabel.textContent = "Buy me a coffee URL";
  const coffeeUrl = el("input") as HTMLInputElement;
  coffeeUrl.type = "url";
  coffeeUrl.placeholder = "https://www.buymeacoffee.com/yourpage";
  coffeeUrl.value = settings.coffeeUrl;
  coffeeUrl.addEventListener("change", async () => {
    await saveSettings({ coffeeUrl: coffeeUrl.value.trim() });
  });
  rowCoffee.append(coffeeLabel, coffeeUrl);

  const openCoffee = el("button", { class: "btn", type: "button" });
  openCoffee.textContent = "Open coffee link";
  openCoffee.addEventListener("click", async () => {
    if (!settings.coffeeUrl) return showToast(root, "Set a coffee URL first");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.create({ url: settings.coffeeUrl });
  });

  card3.append(rowForms, rowCoffee, openCoffee);

  const toast = el("div", { class: "toast", "data-toast": "1" });

  wrap.append(title, card1, card2, card3, toast);
  root.append(wrap);
}

async function main() {
  const root = document.getElementById("app");
  if (!root) return;
  const settings = await loadSettings();
  render(root, settings);

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync") return;
    const next = await loadSettings();
    render(root, next);
  });
}

main().catch((err) => console.error(err));
