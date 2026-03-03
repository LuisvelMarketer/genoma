import type {
  AnyAgentTool,
  GenomaPluginApi,
  GenomaPluginToolFactory,
} from "../../src/plugins/types.js";
import { createLobsterTool } from "./src/lobster-tool.js";

export default function register(api: GenomaPluginApi) {
  api.registerTool(
    ((ctx) => {
      if (ctx.sandboxed) {
        return null;
      }
      return createLobsterTool(api) as AnyAgentTool;
    }) as GenomaPluginToolFactory,
    { optional: true },
  );
}
