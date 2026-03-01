export type BridgeRequest =
  | { type: "BUTTERGPT_INJECT_PROMPT"; text: string }
  | { type: "BUTTERGPT_INJECT_AND_SEND"; text: string }
  | { type: "BUTTERGPT_OPEN_FEEDBACK"; payload: unknown }
  | { type: "BUTTERGPT_OPEN_COFFEE" };

export type BackgroundRequest =
  | { type: "BUTTERGPT_ENQUEUE_FEEDBACK"; entry: FeedbackEntry }
  | { type: "BUTTERGPT_GET_FEEDBACK_QUEUE" }
  | { type: "BUTTERGPT_CLEAR_FEEDBACK_QUEUE" };

export type FeedbackEntry = {
  ts: number;
  pageUrl: string;
  payload: unknown;
};

