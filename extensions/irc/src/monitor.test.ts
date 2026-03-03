import { describe, expect, it } from "vitest";
import { resolveIrcInboundTarget } from "./monitor.js";

describe("irc monitor inbound target", () => {
  it("keeps channel target for group messages", () => {
    expect(
      resolveIrcInboundTarget({
        target: "#genoma",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: true,
      target: "#genoma",
      rawTarget: "#genoma",
    });
  });

  it("maps DM target to sender nick and preserves raw target", () => {
    expect(
      resolveIrcInboundTarget({
        target: "genoma-bot",
        senderNick: "alice",
      }),
    ).toEqual({
      isGroup: false,
      target: "alice",
      rawTarget: "genoma-bot",
    });
  });

  it("falls back to raw target when sender nick is empty", () => {
    expect(
      resolveIrcInboundTarget({
        target: "genoma-bot",
        senderNick: " ",
      }),
    ).toEqual({
      isGroup: false,
      target: "genoma-bot",
      rawTarget: "genoma-bot",
    });
  });
});
