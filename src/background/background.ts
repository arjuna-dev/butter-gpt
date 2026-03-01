import { DEFAULT_SETTINGS } from "../shared/settings";
import type { BackgroundRequest } from "../shared/messages";

type FeedbackStore = {
  queue: Array<{ ts: number; pageUrl: string; payload: unknown }>;
};

const DEFAULT_FEEDBACK: FeedbackStore = { queue: [] };

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.local.get(DEFAULT_FEEDBACK);
});

chrome.runtime.onMessage.addListener((msg: BackgroundRequest, sender, sendResponse) => {
  (async () => {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "BUTTERGPT_ENQUEUE_FEEDBACK") {
      const store = (await chrome.storage.local.get(DEFAULT_FEEDBACK)) as FeedbackStore;
      store.queue.push(msg.entry);
      if (store.queue.length > 200) store.queue.splice(0, store.queue.length - 200);
      await chrome.storage.local.set({ queue: store.queue });
      sendResponse({ ok: true });
      return;
    }
    if (msg.type === "BUTTERGPT_GET_FEEDBACK_QUEUE") {
      const store = (await chrome.storage.local.get(DEFAULT_FEEDBACK)) as FeedbackStore;
      sendResponse({ ok: true, queue: store.queue });
      return;
    }
    if (msg.type === "BUTTERGPT_CLEAR_FEEDBACK_QUEUE") {
      await chrome.storage.local.set({ queue: [] });
      sendResponse({ ok: true });
      return;
    }
  })().catch((err) => {
    console.error("background error", err);
    sendResponse({ ok: false, error: String(err?.message ?? err) });
  });

  return true;
});

