import { directoryTemplatePresets } from "@/config/directory-presets";
import { activeDirectoryPack } from "@/config/directory-packs";

const selectedPreset = directoryTemplatePresets[activeDirectoryPack.templatePreset];

export const directoryConfig = {
  templatePreset: activeDirectoryPack.templatePreset,
  ...selectedPreset
} as const;
