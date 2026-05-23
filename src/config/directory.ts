import { directoryTemplatePresets } from "@/config/directory-presets";

const restaurantPreset = directoryTemplatePresets.restaurant;

export const directoryConfig = {
  templatePreset: "restaurant",
  ...restaurantPreset
} as const;
