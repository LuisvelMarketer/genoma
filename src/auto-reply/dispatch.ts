import type { GenomaConfig } from "../config/config.js";
import type { DispatchFromConfigResult } from "./reply/dispatch-from-config.js";
import { dispatchReplyFromConfig } from "./reply/dispatch-from-config.js";
import { finalizeInboundContext } from "./reply/inbound-context.js";
import {
  createReplyDispatcher,
  createReplyDispatcherWithTyping,
  type ReplyDispatcher,
  type ReplyDispatcherOptions,
  type ReplyDispatcherWithTypingOptions,
} from "./reply/reply-dispatcher.js";
import type { FinalizedMsgContext, MsgContext } from "./templating.js";
import type { GetReplyOptions } from "./types.js";

// ─── GSEP Genome Shield — auto-activates if @gsep/core is installed ──
let _gsepShield: Awaited<ReturnType<typeof import("../gsep/index.js").initGenomeShield>> | null =
  null;
let _gsepInitAttempted = false;

async function getShield() {
  if (_gsepShield) {
    return _gsepShield;
  }
  if (_gsepInitAttempted) {
    return null;
  }
  _gsepInitAttempted = true;
  try {
    const { initGenomeShield } = await import("../gsep/index.js");
    _gsepShield = await initGenomeShield({ profile: "secure" });
    console.log("[Genome Shield] 🧬 Active — Secure profile. PII redaction ON. Audit ON.");
    return _gsepShield;
  } catch {
    // @gsep/core not installed or init failed — continue without shield
    return null;
  }
}

export type DispatchInboundResult = DispatchFromConfigResult;

export async function withReplyDispatcher<T>(params: {
  dispatcher: ReplyDispatcher;
  run: () => Promise<T>;
  onSettled?: () => void | Promise<void>;
}): Promise<T> {
  try {
    return await params.run();
  } finally {
    // Ensure dispatcher reservations are always released on every exit path.
    params.dispatcher.markComplete();
    try {
      await params.dispatcher.waitForIdle();
    } finally {
      await params.onSettled?.();
    }
  }
}

export async function dispatchInboundMessage(params: {
  ctx: MsgContext | FinalizedMsgContext;
  cfg: GenomaConfig;
  dispatcher: ReplyDispatcher;
  replyOptions?: Omit<GetReplyOptions, "onToolResult" | "onBlockReply">;
  replyResolver?: typeof import("./reply.js").getReplyFromConfig;
}): Promise<DispatchInboundResult> {
  const finalized = finalizeInboundContext(params.ctx);

  // ── GSEP Genome Shield: PII redaction + security scan ──────────────
  const shield = await getShield();
  const messageText = finalized.BodyForAgent || finalized.Body;
  if (shield && messageText) {
    const channel = ((finalized as Record<string, unknown>).Channel as string) ?? "unknown";
    const userId = finalized.From ?? "anonymous";
    const shieldResult = await shield.processInbound(messageText, channel, userId);

    if (!shieldResult.allowed) {
      console.log(`[Genome Shield] Blocked: ${shieldResult.blockReason}`);
      params.dispatcher.sendFinalReply({
        text: shieldResult.blockReason ?? "Message blocked by security policy.",
      });
      return await withReplyDispatcher({
        dispatcher: params.dispatcher,
        run: async () => ({ queuedFinal: true, counts: { final: 1, block: 0, tool: 0 } }),
      });
    }

    // Replace message with PII-redacted version (mutate the finalized context)
    if (shieldResult.sanitized !== messageText) {
      const ctx = finalized as Record<string, unknown>;
      if (ctx.BodyForAgent) {
        ctx.BodyForAgent = shieldResult.sanitized;
      } else {
        ctx.Body = shieldResult.sanitized;
      }
    }
  }

  // ── Prompt injection scan (covers Telegram, Discord, Slack, etc.) ──
  const messageTextForScan = finalized.BodyForAgent || finalized.Body;
  if (messageTextForScan) {
    const { scanInboundMessage } = await import("../security/scan-inbound-message.js");
    const senderKey =
      ((finalized as Record<string, unknown>).SenderNumber as string | undefined) ||
      finalized.From ||
      undefined;
    const injectionScan = scanInboundMessage(messageTextForScan, senderKey);
    if (!injectionScan.allowed) {
      console.log(
        `[INJECTION_GUARD] Blocked inbound message from ${senderKey ?? "unknown"}: ${injectionScan.reason}`,
      );
      // Send a safe rejection via the dispatcher and return
      params.dispatcher.sendFinalReply({ text: "I can't process that message." });
      return await withReplyDispatcher({
        dispatcher: params.dispatcher,
        run: async () => ({ queuedFinal: true, counts: { final: 1, block: 0, tool: 0 } }),
      });
    }
  }

  return await withReplyDispatcher({
    dispatcher: params.dispatcher,
    run: () =>
      dispatchReplyFromConfig({
        ctx: finalized,
        cfg: params.cfg,
        dispatcher: params.dispatcher,
        replyOptions: params.replyOptions,
        replyResolver: params.replyResolver,
      }),
  });
}

export async function dispatchInboundMessageWithBufferedDispatcher(params: {
  ctx: MsgContext | FinalizedMsgContext;
  cfg: GenomaConfig;
  dispatcherOptions: ReplyDispatcherWithTypingOptions;
  replyOptions?: Omit<GetReplyOptions, "onToolResult" | "onBlockReply">;
  replyResolver?: typeof import("./reply.js").getReplyFromConfig;
}): Promise<DispatchInboundResult> {
  const { dispatcher, replyOptions, markDispatchIdle } = createReplyDispatcherWithTyping(
    params.dispatcherOptions,
  );
  try {
    return await dispatchInboundMessage({
      ctx: params.ctx,
      cfg: params.cfg,
      dispatcher,
      replyResolver: params.replyResolver,
      replyOptions: {
        ...params.replyOptions,
        ...replyOptions,
      },
    });
  } finally {
    markDispatchIdle();
  }
}

export async function dispatchInboundMessageWithDispatcher(params: {
  ctx: MsgContext | FinalizedMsgContext;
  cfg: GenomaConfig;
  dispatcherOptions: ReplyDispatcherOptions;
  replyOptions?: Omit<GetReplyOptions, "onToolResult" | "onBlockReply">;
  replyResolver?: typeof import("./reply.js").getReplyFromConfig;
}): Promise<DispatchInboundResult> {
  const dispatcher = createReplyDispatcher(params.dispatcherOptions);
  return await dispatchInboundMessage({
    ctx: params.ctx,
    cfg: params.cfg,
    dispatcher,
    replyResolver: params.replyResolver,
    replyOptions: params.replyOptions,
  });
}
