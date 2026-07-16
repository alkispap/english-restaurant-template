import fs from "node:fs";
import path from "node:path";

export function writeTextFilesAtomically(files: ReadonlyMap<string, string>) {
  const originals = new Map<string, string | undefined>();
  const temporaryPaths = new Map<string, string>();
  for (const [filePath, contents] of files) {
    originals.set(filePath, fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : undefined);
    const temporaryPath = `${filePath}.publication-tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(temporaryPath, contents, "utf8");
    temporaryPaths.set(filePath, temporaryPath);
  }
  try {
    for (const [filePath, temporaryPath] of temporaryPaths) fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    for (const [filePath, original] of originals) {
      if (original === undefined) {
        if (fs.existsSync(filePath)) fs.rmSync(filePath);
      } else {
        fs.writeFileSync(filePath, original, "utf8");
      }
    }
    throw error;
  } finally {
    for (const temporaryPath of temporaryPaths.values()) if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath);
  }
}

export function jsonFile(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function optionValue(args: string[], name: string) {
  const argument = args.find((value) => value.startsWith(`${name}=`));
  return argument?.slice(name.length + 1).trim() || undefined;
}
