import StyleDictionary from "style-dictionary";
import config from "../style-dictionary.config.mjs";

// 不走 style-dictionary 的 CLI：它的 glob 相依在 Node 22 下 ESM 互通會炸
const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();
