/**
 * GSEP Integration for Genome — Genome Shield
 *
 * Wires @gsep/core security into Genome's agent pipeline.
 * 7-layer security: prompt firewall, PII redaction, Keychain vault,
 * execution guard, network control, and audit trail.
 *
 * @module gsep
 * @author Luis Alfredo Velasquez Duran
 * @since 2026-03-30
 */

import {
  GenomeSecurityBridge,
  SecurityEventBus,
  CommandExecutionGuard,
  FileSystemBoundary,
  OutboundAllowlist,
  NetworkAuditLogger,
  DataAccessTracker,
  TamperProofAuditLog,
  KeychainAdapter,
  KeyHierarchy,
  ComplianceExporter,
  getSecurityPreset,
  type SecurityPresetName,
  type SecurityConfig,
  type InboundResult,
  type OutboundResult,
} from "@gsep/core/security";

// ─── Types ──────────────────────────────────────────────

export interface GenomeShieldConfig {
  /** Security profile: paranoid, secure, standard, developer */
  profile: SecurityPresetName;
  /** Override specific security settings */
  overrides?: Partial<SecurityConfig>;
  /** Path to audit log directory */
  auditDir?: string;
}

export interface GenomeShield {
  /** Process inbound message through security layers */
  processInbound: (message: string, channel: string, userId?: string) => Promise<InboundResult>;
  /** Process outbound response through security layers */
  processOutbound: (response: string) => Promise<OutboundResult>;
  /** Check if a command is allowed */
  checkCommand: (command: string, args: string[]) => string;
  /** Check if a file path is accessible */
  checkPath: (path: string, access: "read" | "write" | "delete") => boolean;
  /** Check if an outbound domain is allowed */
  checkDomain: (hostname: string) => boolean;
  /** Record a data access event */
  trackDataAccess: (
    source: string,
    category: string,
    skillId: string,
    description: string,
    sentToCloud: boolean,
    itemCount: number,
    cloudProvider?: string,
  ) => void;
  /** Export compliance report */
  exportReport: (
    type: "data-access" | "security-incidents" | "full-audit",
    format: "json" | "csv",
  ) => string;
  /** Get security status */
  getStatus: () => Record<string, unknown>;
  /** Cleanup on shutdown */
  shutdown: () => Promise<void>;
  /** The event bus (for dashboard/audit subscriptions) */
  eventBus: SecurityEventBus;
}

// ─── Initialize ─────────────────────────────────────────

/**
 * Initialize Genome Shield — call once at startup.
 *
 * ```typescript
 * import { initGenomeShield } from './gsep/index.js';
 *
 * const shield = await initGenomeShield({ profile: 'secure' });
 *
 * // In dispatch pipeline:
 * const inbound = await shield.processInbound(message, 'telegram', userId);
 * if (!inbound.allowed) return inbound.blockReason;
 * ```
 */
export async function initGenomeShield(config: GenomeShieldConfig): Promise<GenomeShield> {
  const securityConfig = config.overrides
    ? { ...getSecurityPreset(config.profile), ...config.overrides }
    : getSecurityPreset(config.profile);

  // ─── Layer 1: Event Bus ─────────────────────────────
  const eventBus = new SecurityEventBus();

  // ─── Layer 3: Credential Vault ──────────────────────
  const keychain = new KeychainAdapter();
  const keyHierarchy = new KeyHierarchy(keychain);

  let auditLog: TamperProofAuditLog | undefined;

  if (securityConfig.enableEncryptedConfig) {
    try {
      await keyHierarchy.initialize();
      const keys = keyHierarchy.getDerivedKeys();

      // ─── Layer 7: Audit Log ───────────────────────
      auditLog = new TamperProofAuditLog(keys.alk, keychain, config.auditDir);
      await auditLog.initialize();

      // Subscribe audit log to all security events
      eventBus.onAny((event) => {
        auditLog?.appendFromEvent(event).catch(() => {});
      });
    } catch {
      // Keychain not available (CI, non-macOS) — continue without encryption
      console.log("[Genome Shield] Keychain not available — running without encrypted vault");
    }
  }

  // ─── Layer 1: Security Bridge ─────────────────────
  const bridge = new GenomeSecurityBridge(securityConfig, eventBus);

  // ─── Layer 5: Execution Guard ─────────────────────
  const execGuard = new CommandExecutionGuard(eventBus);

  const fsBoundary = new FileSystemBoundary(eventBus, {
    allowedPaths: securityConfig.allowedPaths,
    deniedPaths: securityConfig.deniedPaths,
    allowHomeDir: securityConfig.allowedPaths.includes("~"),
  });

  // ─── Layer 6: Network Control ─────────────────────
  const outboundAllowlist = new OutboundAllowlist(eventBus, {
    allowedDomains: securityConfig.allowedDomains,
    blockPrivateNetworks: securityConfig.blockPrivateNetworks,
    mode:
      securityConfig.networkPolicy === "allowlist-strict"
        ? "strict"
        : securityConfig.networkPolicy === "allowlist-broad"
          ? "broad"
          : securityConfig.networkPolicy === "unrestricted"
            ? "unrestricted"
            : "strict",
  });

  const networkLogger = new NetworkAuditLogger(eventBus);

  // ─── Layer 7: Data Access Tracker ─────────────────
  const dataTracker = new DataAccessTracker(eventBus);
  const complianceExporter = new ComplianceExporter(dataTracker, eventBus);

  // ─── Log startup ──────────────────────────────────
  eventBus.emit({
    type: "security:profile-changed",
    timestamp: new Date(),
    layer: 1,
    decision: "info",
    actor: {},
    resource: { type: "profile", id: securityConfig.profile },
    severity: "info",
  });

  console.log(`[Genome Shield] Initialized with profile: ${securityConfig.profile}`);

  // ─── Public API ───────────────────────────────────
  return {
    processInbound: (message, channel, userId) => bridge.processInbound(message, channel, userId),

    processOutbound: (response) => bridge.processOutbound(response),

    checkCommand: (command, args) => execGuard.evaluate({ command, args }),

    checkPath: (path, access) => fsBoundary.isAllowed(path, access),

    checkDomain: (hostname) => outboundAllowlist.check(hostname).allowed,

    trackDataAccess: (
      source,
      category,
      skillId,
      description,
      sentToCloud,
      itemCount,
      cloudProvider,
    ) =>
      dataTracker.record({
        source: source as never,
        category: category as never,
        skillId,
        description,
        sentToCloud,
        itemCount,
        cloudProvider,
      }),

    exportReport: (type, format) => complianceExporter.export({ type, format }).content,

    getStatus: () => ({
      profile: securityConfig.profile,
      bridge: bridge.getStatus(),
      exec: execGuard.getStats(),
      fs: fsBoundary.getStats(),
      network: { ...outboundAllowlist.getStats(), traffic: networkLogger.getSummary() },
      dataAccess: dataTracker.getReport(),
      auditEntries: auditLog?.getEntryCount() ?? 0,
    }),

    shutdown: async () => {
      await auditLog?.flush();
      keyHierarchy.destroy();
      bridge.clearSession();
    },

    eventBus,
  };
}

export const GSEP_VERSION = "0.8.0";
export const GSEP_STATUS = "integrated";
