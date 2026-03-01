export type ThemePreset = "pastel" | "midnight";

export type Settings = {
  enabled: boolean;
  motionIntensity: number; // 0..100
  themePreset: ThemePreset;
  showFallbackTab: boolean;
  feedbackFormUrl: string;
  coffeeUrl: string;
};

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  motionIntensity: 65,
  themePreset: "midnight",
  showFallbackTab: true,
  feedbackFormUrl: "",
  coffeeUrl: "",
};
