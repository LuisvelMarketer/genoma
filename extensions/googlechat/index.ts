import type { GenomaPluginApi } from "genoma/plugin-sdk";
import { emptyPluginConfigSchema } from "genoma/plugin-sdk";
import { googlechatDock, googlechatPlugin } from "./src/channel.js";
import { setGoogleChatRuntime } from "./src/runtime.js";

const plugin = {
  id: "googlechat",
  name: "Google Chat",
  description: "Genoma Google Chat channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: GenomaPluginApi) {
    setGoogleChatRuntime(api.runtime);
    api.registerChannel({ plugin: googlechatPlugin, dock: googlechatDock });
  },
};

export default plugin;
