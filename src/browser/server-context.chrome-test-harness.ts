import { vi } from "vitest";
import { installChromeUserDataDirHooks } from "./chrome-user-data-dir.test-harness.js";

const chromeUserDataDir = { dir: "/tmp/genoma" };
installChromeUserDataDirHooks(chromeUserDataDir);

vi.mock("./chrome.js", () => ({
  isChromeCdpReady: vi.fn(async () => true),
  isChromeReachable: vi.fn(async () => true),
  launchGenomaChrome: vi.fn(async () => {
    throw new Error("unexpected launch");
  }),
  resolveGenomaUserDataDir: vi.fn(() => chromeUserDataDir.dir),
  stopGenomaChrome: vi.fn(async () => {}),
}));
