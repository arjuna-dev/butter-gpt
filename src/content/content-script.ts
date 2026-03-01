import createDOMPurify from "dompurify";
import waterDarkCss from "water.css/out/dark.min.css";
import { DEFAULT_SETTINGS, type Settings } from "../shared/settings";
import type { FeedbackEntry } from "../shared/messages";

const PROCESSED_ATTR = "data-buttergpt-processed";
const VIEW_ATTR = "data-buttergpt-view";
const WRAPPER_ATTR = "data-buttergpt-wrapper";

type ButterView = "read" | "original";

const dompurify = createDOMPurify(window);

declare global {
  interface Window {
    BeautyBridge?: {
      injectPrompt: (text: string) => void;
      injectAndSend: (text: string) => void;
      openFeedback: (payload: unknown) => void;
      openCoffee: () => void;
      version: string;
    };
  }
}

function ensureGlobalStyle() {
  if (document.getElementById("buttergpt-global-style")) return;
  const style = document.createElement("style");
  style.id = "buttergpt-global-style";
  style.textContent = `
    [data-message-author-role="assistant"][${VIEW_ATTR}="read"] > :not([${WRAPPER_ATTR}="1"]) { display: none !important; }
    [${WRAPPER_ATTR}="1"] { display: block; width: 100%; max-width: none; }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function getAssistantMessageNodes(root: ParentNode): HTMLElement[] {
  const direct = Array.from(root.querySelectorAll<HTMLElement>('[data-message-author-role="assistant"]'));
  if (direct.length) return direct;
  const fallback = Array.from(root.querySelectorAll<HTMLElement>("article"));
  return fallback.filter((a) => /assistant/i.test(a.innerText.slice(0, 150)));
}
function adaptWaterCss(css: string) {
  return css
    .replaceAll(":root", ":host")
    .replace(/(^|[,{])html(?=[\\s,{])/g, "$1:host")
    .replace(/(^|[,{])body(?=[\\s,{])/g, "$1:host");
}

const DESIGN_CSS = `${adaptWaterCss(waterDarkCss)}

:host{
  display:block;
  width: 100%;
  max-width: none;
  margin: 10px 0;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(12, 18, 26, 0.92);
  box-shadow: 0 22px 60px rgba(0,0,0,.45);
  --butter-motion: 0.65;
}

@media (prefers-reduced-motion: reduce){
  :host{ --butter-motion: 0.08; }
}

.butter-top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
}

.butter-brand{
  display:flex;
  align-items:center;
  gap: 10px;
  min-width: 0;
}

.butter-spark{
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display:grid;
  place-items:center;
  border: 1px solid rgba(255,255,255,.14);
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.28), rgba(255,255,255,.06));
  color: rgba(255,255,255,.92);
  cursor:pointer;
  transition: transform calc(180ms * var(--butter-motion)) ease, border-color 180ms ease;
}
.butter-spark:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.28); }

.butter-title{
  font: 700 12px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  letter-spacing: .2px;
  color: rgba(255,255,255,.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.butter-sub{
  font: 500 11px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  color: rgba(255,255,255,.55);
  margin-top: 2px;
}

.butter-tabs{
  display:flex;
  align-items:center;
  gap: 6px;
}

.butter-tab{
  appearance:none;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.80);
  border-radius: 999px;
  padding: 7px 10px;
  font: 700 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  cursor:pointer;
}
.butter-tab[aria-pressed="true"]{
  background: rgba(65,173,255,.16);
  border-color: rgba(65,173,255,.42);
  color: rgba(255,255,255,.92);
}

.butter-actions{
  display:flex;
  align-items:center;
  gap: 8px;
}

.butter-consent{
  display:flex;
  align-items:center;
  gap: 6px;
  font: 600 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  color: rgba(255,255,255,.70);
  user-select:none;
}
.butter-consent input{ margin: 0; transform: translateY(1px); }

.butter-action{
  appearance:none;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.82);
  border-radius: 12px;
  padding: 7px 10px;
  font: 700 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  cursor:pointer;
}
.butter-action:hover{ border-color: rgba(255,255,255,.28); }

.butter-body{
  padding: 14px 12px 12px;
}

.butter-read{
  display:block;
}
:host([data-active="original"]) .butter-read{ display:none; }

.butter-original-hint{
  display:none;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,.16);
  background: rgba(0,0,0,.20);
  color: rgba(255,255,255,.68);
  font: 600 12px/1.35 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
:host([data-active="original"]) .butter-original-hint{ display:block; }

.butter-content{
  width: 100%;
  max-width: none;
  font-size: 15px;
  line-height: 1.65;
}

.butter-content :where(h1,h2,h3){
  color: rgba(255,255,255,.96);
}
.butter-content :where(p,li){
  color: rgba(255,255,255,.82);
}
.butter-content :where(strong){
  color: rgba(255,255,255,.96);
}
.butter-content :where(em){
  color: rgba(255,255,255,.90);
}
.butter-content :where(a){
  color: #8bd0ff;
}
.butter-content :where(a:hover){
  text-decoration: underline;
  text-underline-offset: 2px;
}
.butter-content :where(code){
  color: #ffbe85;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 10px;
  padding: 2px 6px;
}
.butter-content :where(pre){
  border-radius: 14px;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.10);
  padding: 10px;
}
.butter-content :where(pre code){
  background: transparent;
  border: 0;
  padding: 0;
}

.butter-content :where(blockquote){
  border-left: 3px solid rgba(65,173,255,.45);
  background: rgba(65,173,255,.08);
  border-radius: 14px;
  padding: 10px 12px;
  color: rgba(255,255,255,.86);
}
.butter-content :where(hr){
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
  margin: 18px 0;
}
.butter-content :where(img){
  max-width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
}
.butter-content :where(table){
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
}
.butter-content :where(th,td){
  padding: 9px 10px;
  border-bottom: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.84);
}
.butter-content :where(th){
  color: rgba(255,255,255,.92);
  font-weight: 800;
  background: rgba(255,255,255,.06);
}
.butter-content :where(tr:last-child td){
  border-bottom: 0;
}

.butter-inline-cta{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  border: 1px solid rgba(65,173,255,.40);
  background: rgba(65,173,255,.10);
  color: rgba(255,255,255,.92);
  border-radius: 999px;
  padding: 7px 10px;
  margin: 2px 0;
  font: 800 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  cursor:pointer;
  transition: transform calc(180ms * var(--butter-motion)) ease;
}
.butter-inline-cta:hover{ transform: translateY(-1px); }
.butter-inline-cta[data-send="1"]{
  border-color: rgba(134,239,172,.45);
  background: rgba(134,239,172,.12);
}

.butter-easter{
  display:inline-grid;
  place-items:center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.88);
  cursor:pointer;
}

.butter-loading{
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px dashed rgba(255,255,255,.14);
  background: rgba(0,0,0,.22);
  color: rgba(255,255,255,.72);
  font: 600 12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.butter-toast{
  position:fixed;
  left: 14px;
  bottom: 14px;
  background: rgba(7, 11, 18, 0.94);
  color: rgba(255,255,255,.92);
  border: 1px solid rgba(255,255,255,.12);
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 18px 45px rgba(0,0,0,.45);
  opacity:0;
  transform: translateY(8px);
  transition: opacity 180ms ease, transform 180ms ease;
  pointer-events:none;
  z-index: 2147483647;
}
.butter-toast[data-show="1"]{ opacity:1; transform: translateY(0px); }
`;

function createWrapperShadow(host: HTMLElement, settings: Settings, messageEl: HTMLElement) {
  const shadow = host.attachShadow({ mode: "open" });
  host.setAttribute("data-active", "read");
  host.style.setProperty("--butter-motion", String(settings.motionIntensity / 100));

  shadow.innerHTML = `
    <style>${DESIGN_CSS}</style>
    <div class="butter-top">
      <div class="butter-brand">
        <button class="butter-spark" type="button" title="Zen (easter egg)" aria-label="Zen">✦</button>
        <div style="min-width:0">
          <div class="butter-title">butterGPT</div>
          <div class="butter-sub">reading view</div>
        </div>
      </div>
      <div class="butter-tabs">
        <button class="butter-tab" type="button" aria-pressed="true" data-tab="read">Read</button>
        <button class="butter-tab" type="button" aria-pressed="false" data-tab="original">Original</button>
      </div>
      <div class="butter-actions">
        <label class="butter-consent" title="Enable to allow [[send: ...]] buttons to auto-send">
          <input type="checkbox" data-send-consent />
          Send
        </label>
        <button class="butter-action" type="button" data-feedback>Feedback</button>
        <button class="butter-action" type="button" data-coffee>Coffee</button>
      </div>
    </div>
    <div class="butter-body">
      <div class="butter-read">
        <div class="butter-content" data-content></div>
      </div>
      <div class="butter-original-hint">Original ChatGPT message is shown below. (This tab uses ChatGPT’s own styling.)</div>
    </div>
    <div class="butter-toast" data-toast></div>
  `;

  const tabRead = shadow.querySelector<HTMLButtonElement>('[data-tab="read"]')!;
  const tabOriginal = shadow.querySelector<HTMLButtonElement>('[data-tab="original"]')!;
  const content = shadow.querySelector<HTMLElement>("[data-content]")!;
  const sendConsent = shadow.querySelector<HTMLInputElement>("[data-send-consent]")!;
  const toastEl = shadow.querySelector<HTMLDivElement>("[data-toast]")!;
  const spark = shadow.querySelector<HTMLButtonElement>(".butter-spark")!;
  const sub = shadow.querySelector<HTMLDivElement>(".butter-sub")!;

  const showToast = (text: string) => {
    toastEl.textContent = text;
    toastEl.dataset.show = "1";
    window.setTimeout(() => (toastEl.dataset.show = "0"), 1400);
  };

  const setView = (view: ButterView) => {
    const isRead = view === "read";
    host.setAttribute("data-active", view);
    messageEl.setAttribute(VIEW_ATTR, view);
    tabRead.setAttribute("aria-pressed", isRead ? "true" : "false");
    tabOriginal.setAttribute("aria-pressed", isRead ? "false" : "true");
  };

  tabRead.onclick = () => setView("read");
  tabOriginal.onclick = () => setView("original");

  shadow.querySelector<HTMLButtonElement>("[data-feedback]")!.onclick = () => void openFeedback({ source: "wrapper" });
  shadow.querySelector<HTMLButtonElement>("[data-coffee]")!.onclick = () => void openCoffee();

  spark.onclick = () => {
    const z = host.getAttribute("data-zen") === "1";
    host.setAttribute("data-zen", z ? "0" : "1");
    sub.textContent = z ? "reading view" : "…quiet mode";
    showToast(z ? "Zen off" : "Zen on");
  };

  content.addEventListener("click", (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const cta = t.closest<HTMLElement>("[data-butter-cta]");
    if (cta) {
      const text = cta.getAttribute("data-butter-text") ?? "";
      const send = cta.getAttribute("data-butter-send") === "1";
      if (!text.trim()) return;
      if (send && !sendConsent.checked) {
        showToast("Enable Send to auto-send");
        injectPrompt(text);
        return;
      }
      if (send) injectAndSend(text);
      else injectPrompt(text);
      showToast(send ? "Sent" : "Inserted");
      return;
    }

    const egg = t.closest<HTMLElement>("[data-butter-easter]");
    if (egg) {
      showToast(String(egg.getAttribute("data-butter-easter") ?? "✦"));
    }
  });

  if (!settings.showFallbackTab) tabOriginal.style.display = "none";

  setView("read");
  return { shadow, content, sendConsent, showToast, setView };
}

function locatePromptElements(): { textarea: HTMLTextAreaElement | null; sendButton: HTMLButtonElement | null } {
  const textarea =
    (document.querySelector<HTMLTextAreaElement>("textarea#prompt-textarea") ??
      document.querySelector<HTMLTextAreaElement>('textarea[data-testid="prompt-textarea"]') ??
      document.querySelector<HTMLTextAreaElement>("form textarea") ??
      document.querySelector<HTMLTextAreaElement>("textarea")) ||
    null;

  const sendButton =
    (document.querySelector<HTMLButtonElement>('button[data-testid="send-button"]') ??
      document.querySelector<HTMLButtonElement>('button[aria-label*="Send"]') ??
      document.querySelector<HTMLButtonElement>('button[aria-label*="send"]')) ||
    null;

  return { textarea, sendButton };
}

function injectPrompt(text: string) {
  const { textarea } = locatePromptElements();
  if (!textarea) return;
  textarea.focus();
  textarea.value = text;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function injectAndSend(text: string) {
  const { textarea, sendButton } = locatePromptElements();
  if (!textarea) return;
  textarea.focus();
  textarea.value = text;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  if (sendButton) sendButton.click();
}

let modalHost: HTMLElement | null = null;
let modalShadow: ShadowRoot | null = null;

async function getSettings(): Promise<Settings> {
  const res = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  return res as Settings;
}

function ensureFeedbackModal() {
  if (modalHost && modalShadow) return;
  modalHost = document.createElement("div");
  modalHost.id = "buttergpt-feedback-modal";
  modalHost.style.all = "initial";
  modalHost.style.position = "fixed";
  modalHost.style.inset = "0";
  modalHost.style.zIndex = "2147483647";
  modalHost.style.display = "none";
  document.documentElement.appendChild(modalHost);
  modalShadow = modalHost.attachShadow({ mode: "open" });
  modalShadow.innerHTML = `
    <style>
      :host{ all: initial; }
      .backdrop{
        position:fixed; inset:0;
        background: rgba(2, 6, 23, 0.62);
        backdrop-filter: blur(8px);
        display:grid;
        place-items:center;
        padding: 22px;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .card{
        width: min(820px, 96vw);
        max-height: min(86vh, 820px);
        overflow:auto;
        background: linear-gradient(180deg, rgba(17, 24, 39, .92), rgba(17, 24, 39, .85));
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 18px;
        box-shadow: 0 30px 80px rgba(0,0,0,.55);
        padding: 14px;
        display:grid;
        gap: 12px;
      }
      .top{
        display:flex; align-items:center; justify-content:space-between; gap: 10px;
      }
      .top h2{
        margin:0;
        font-size: 14px;
        font-weight: 700;
        color: rgba(255,255,255,.88);
        letter-spacing:.2px;
      }
      .x{
        appearance:none;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.06);
        border-radius: 999px;
        padding: 8px 10px;
        cursor:pointer;
        font-weight: 700;
        color: rgba(255,255,255,.88);
      }
      .grid{
        display:grid;
        gap: 10px;
      }
      .q{
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        background: rgba(255,255,255,.05);
        padding: 12px;
      }
      .q label{ display:block; font-size: 12px; color: rgba(255,255,255,.76); margin-bottom: 8px; }
      .opts{ display:flex; flex-wrap:wrap; gap: 8px; }
      .opt{
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        border-radius: 999px;
        padding: 8px 10px;
        cursor:pointer;
        font-size: 12px;
        color: rgba(255,255,255,.86);
      }
      .opt[aria-pressed="true"]{
        border-color: rgba(65,173,255,.55);
        background: rgba(65,173,255,.18);
      }
      .actions{
        display:flex; align-items:center; justify-content:space-between; gap: 10px;
      }
      .btn{
        appearance:none;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.06);
        border-radius: 12px;
        padding: 10px 12px;
        cursor:pointer;
        font-weight: 700;
        font-size: 12px;
        color: rgba(255,255,255,.90);
      }
      .btn.primary{
        border-color: rgba(65,173,255,.65);
        background: rgba(65,173,255,.18);
      }
      iframe{
        width:100%;
        height: 420px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        background: rgba(0,0,0,.18);
      }
      .hint{
        font-size: 12px;
        color: rgba(255,255,255,.62);
        line-height: 1.35;
      }
      pre{
        margin:0;
        background: rgba(0,0,0,.18);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        padding: 10px;
        overflow:auto;
        font-size: 11px;
        color: rgba(255,255,255,.88);
      }
    </style>
    <div class="backdrop" role="dialog" aria-modal="true">
      <div class="card">
        <div class="top">
          <h2>butterGPT feedback</h2>
          <button class="x" type="button" aria-label="Close">✕</button>
        </div>
        <div class="grid">
          <div class="q" data-q="helpful">
            <label>How helpful was this butterGPT UI?</label>
            <div class="opts">
              <button class="opt" type="button" data-val="1">1</button>
              <button class="opt" type="button" data-val="2">2</button>
              <button class="opt" type="button" data-val="3">3</button>
              <button class="opt" type="button" data-val="4">4</button>
              <button class="opt" type="button" data-val="5">5</button>
            </div>
          </div>
          <div class="q" data-q="next">
            <label>What should we build next?</label>
            <div class="opts" data-next-opts></div>
          </div>
          <div class="q" data-q="retention">
            <label>Would you use butterGPT again this week?</label>
            <div class="opts">
              <button class="opt" type="button" data-val="yes">Yes</button>
              <button class="opt" type="button" data-val="no">No</button>
            </div>
          </div>
          <div class="q">
            <label>Debug payload (optional)</label>
            <pre data-payload></pre>
            <div class="hint">You can leave this empty. It's only for developers.</div>
          </div>
          <div class="q" data-forms>
            <label>Google Form (embedded)</label>
            <div class="hint" data-forms-hint></div>
            <iframe data-forms-iframe loading="lazy" referrerpolicy="no-referrer"></iframe>
          </div>
        </div>
        <div class="actions">
          <div class="hint">This is stored locally in your extension, and optionally submitted via the embedded form.</div>
          <button class="btn primary" type="button" data-send>Save feedback</button>
        </div>
      </div>
    </div>
  `;

  const close = modalShadow.querySelector<HTMLButtonElement>(".x")!;
  close.addEventListener("click", closeFeedback);
  modalShadow.querySelector(".backdrop")!.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFeedback();
  });
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

function wireOptionButtons(scope: Element, onPick: (val: string) => void) {
  const buttons = Array.from(scope.querySelectorAll<HTMLButtonElement>(".opt"));
  buttons.forEach((x) => x.setAttribute("aria-pressed", "false"));
  buttons.forEach((b) => {
    b.onclick = () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      onPick(String(b.dataset.val ?? ""));
    };
  });
}

let lastFeedbackPayload: unknown = null;
let lastFeedbackMeta: { pageUrl: string } = { pageUrl: "" };

async function openFeedback(payload: unknown) {
  ensureFeedbackModal();
  if (!modalHost || !modalShadow) return;

  const settings = await getSettings();
  lastFeedbackPayload = payload;
  lastFeedbackMeta = { pageUrl: location.href };

  const pre = modalShadow.querySelector<HTMLElement>("[data-payload]")!;
  pre.textContent = JSON.stringify(payload ?? null, null, 2);

  const nextOptsHost = modalShadow.querySelector<HTMLElement>("[data-next-opts]")!;
  nextOptsHost.innerHTML = "";
  const options = pickRandom(
    [
      "more themes",
      "smarter CTAs",
      "better diagrams",
      "export and save",
      "desktop bring your own model",
      "companion web dashboard",
    ],
    4,
  );
  for (const o of options) {
    const b = document.createElement("button");
    b.className = "opt";
    b.type = "button";
    b.dataset.val = o;
    b.textContent = o;
    nextOptsHost.appendChild(b);
  }

  const state: { helpful: string; next: string; retention: string } = { helpful: "", next: "", retention: "" };
  const helpful = modalShadow.querySelector('[data-q="helpful"]')!;
  const next = modalShadow.querySelector('[data-q="next"]')!;
  const retention = modalShadow.querySelector('[data-q="retention"]')!;
  wireOptionButtons(helpful, (v) => (state.helpful = v));
  wireOptionButtons(next, (v) => (state.next = v));
  wireOptionButtons(retention, (v) => (state.retention = v));

  const iframe = modalShadow.querySelector<HTMLIFrameElement>("[data-forms-iframe]")!;
  const hint = modalShadow.querySelector<HTMLElement>("[data-forms-hint]")!;
  if (settings.feedbackFormUrl) {
    iframe.src = settings.feedbackFormUrl;
    iframe.style.display = "block";
    hint.textContent = "";
  } else {
    iframe.removeAttribute("src");
    iframe.style.display = "none";
    hint.textContent = "Set a Google Form URL in the butterGPT popup to embed it here.";
  }

  const send = modalShadow.querySelector<HTMLButtonElement>("[data-send]")!;
  send.onclick = async () => {
    const entry: FeedbackEntry = {
      ts: Date.now(),
      pageUrl: lastFeedbackMeta.pageUrl,
      payload: { ...state, payload: lastFeedbackPayload },
    };
    await chrome.runtime.sendMessage({ type: "BUTTERGPT_ENQUEUE_FEEDBACK", entry });
    closeFeedback();
  };

  modalHost.style.display = "block";
}

function closeFeedback() {
  if (!modalHost) return;
  modalHost.style.display = "none";
}

async function openCoffee() {
  const settings = await getSettings();
  if (!settings.coffeeUrl) return;
  window.open(settings.coffeeUrl, "_blank", "noopener,noreferrer");
}

function ensureBeautyBridge() {
  if (window.BeautyBridge) return;
  window.BeautyBridge = {
    version: "0.1.0",
    injectPrompt(text: string) {
      injectPrompt(String(text ?? ""));
    },
    injectAndSend(text: string) {
      injectAndSend(String(text ?? ""));
    },
    openFeedback(payload: unknown) {
      void openFeedback(payload);
    },
    openCoffee() {
      void openCoffee();
    },
  };
}

type MessageController = {
  messageEl: HTMLElement;
  host: HTMLElement;
  content: HTMLElement;
  sendConsent: HTMLInputElement;
  showToast: (text: string) => void;
  lastRenderedHtml: string;
  observer: MutationObserver;
};

const controllers = new WeakMap<HTMLElement, MessageController>();

function extractMessageHtml(messageEl: HTMLElement): string {
  const preferred =
    messageEl.querySelector<HTMLElement>("div.markdown") ??
    messageEl.querySelector<HTMLElement>('div[class*="markdown"]') ??
    messageEl.querySelector<HTMLElement>("div.prose") ??
    messageEl.querySelector<HTMLElement>('div[class*="prose"]');

  if (preferred?.innerHTML?.trim()) return preferred.innerHTML;

  const parts: string[] = [];
  for (const child of Array.from(messageEl.children)) {
    if ((child as HTMLElement).getAttribute(WRAPPER_ATTR) === "1") continue;
    parts.push((child as HTMLElement).innerHTML);
  }
  return parts.join("\n");
}

function sanitizeAndRender(container: HTMLElement, rawHtml: string) {
  const cleaned = dompurify.sanitize(rawHtml, {
    WHOLE_DOCUMENT: false,
    FORBID_TAGS: [
      "script",
      "style",
      "iframe",
      "object",
      "embed",
      "link",
      "form",
      "input",
      "textarea",
      "select",
      "button",
    ],
    FORBID_ATTR: ["style", "srcdoc", "onerror", "onload", "onclick", "onmouseover", "onmouseenter", "onmouseleave"],
  });

  container.innerHTML = cleaned;
  if (cleaned.includes("[[")) enhanceTokens(container);
  enforceSafeLinks(container);
}

function enforceSafeLinks(root: HTMLElement) {
  for (const a of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
}

function enhanceTokens(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) nodes.push(n as Text);
    n = walker.nextNode();
  }

  const tokenRe = /\[\[(cta|send|easter)\s*:\s*([\s\S]*?)\]\]/g;

  for (const textNode of nodes) {
    const text = textNode.nodeValue ?? "";
    tokenRe.lastIndex = 0;
    if (!tokenRe.test(text)) continue;

    tokenRe.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let m: RegExpExecArray | null;
    while ((m = tokenRe.exec(text))) {
      const [full, kind, body] = m;
      const start = m.index;
      const end = start + full.length;
      if (start > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));

      const payload = String(body ?? "").trim();
      if (kind === "easter") {
        const b = document.createElement("span");
        b.className = "butter-easter";
        b.setAttribute("role", "button");
        b.setAttribute("aria-label", payload || "Easter egg");
        b.tabIndex = 0;
        b.textContent = "✦";
        b.setAttribute("data-butter-easter", payload || "✦");
        frag.appendChild(b);
      } else {
        const [label, prompt] = payload.split("|").map((s) => s.trim());
        const button = document.createElement("button");
        button.type = "button";
        button.className = "butter-inline-cta";
        button.textContent = label || "Continue";
        button.setAttribute("data-butter-cta", "1");
        button.setAttribute("data-butter-text", (prompt || label || "").trim());
        if (kind === "send") button.setAttribute("data-butter-send", "1");
        frag.appendChild(button);
      }

      lastIdx = end;
    }

    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

async function processAssistantMessage(messageEl: HTMLElement, settings: Settings) {
  if (controllers.has(messageEl)) return;
  messageEl.setAttribute(PROCESSED_ATTR, "1");
  messageEl.setAttribute(VIEW_ATTR, "read");

  const host = document.createElement("div");
  host.setAttribute(WRAPPER_ATTR, "1");
  host.style.width = "100%";
  host.style.maxWidth = "none";
  messageEl.insertBefore(host, messageEl.firstChild);

  const { content, sendConsent, showToast } = createWrapperShadow(host, settings, messageEl);

  const controller: MessageController = {
    messageEl,
    host,
    content,
    sendConsent,
    showToast,
    lastRenderedHtml: "",
    observer: new MutationObserver(() => {}),
  };
  controllers.set(messageEl, controller);

  const update = () => {
    const html = extractMessageHtml(messageEl);
    if (!html.trim()) {
      if (controller.lastRenderedHtml !== "__loading__") {
        content.innerHTML = `<div class="butter-loading">Waiting for the response…</div>`;
        controller.lastRenderedHtml = "__loading__";
      }
      return;
    }
    if (html === controller.lastRenderedHtml) return;
    sanitizeAndRender(content, html);
    controller.lastRenderedHtml = html;
  };

  // Render quickly, then keep updating while streaming.
  update();

  let debounce: number | null = null;
  const obs = new MutationObserver((muts) => {
    if (muts.some((m) => (m.target instanceof Node ? host.contains(m.target as Node) : false))) return;
    if (debounce) window.clearTimeout(debounce);
    debounce = window.setTimeout(update, 80);
  });
  obs.observe(messageEl, { childList: true, subtree: true, characterData: true });
  controller.observer = obs;
}

async function main() {
  ensureBeautyBridge();
  ensureGlobalStyle();
  ensureFeedbackModal();

  let settings = await getSettings();
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled || changes.motionIntensity || changes.showFallbackTab || changes.themePreset) {
      settings = await getSettings();
    }
  });

  const processAll = async (root: ParentNode) => {
    if (!settings.enabled) return;
    const nodes = getAssistantMessageNodes(root);
    for (const n of nodes) await processAssistantMessage(n, settings);
  };

  await processAll(document);

  const obs = new MutationObserver(() => {
    void processAll(document);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

main().catch((err) => console.error("butterGPT init failed", err));
