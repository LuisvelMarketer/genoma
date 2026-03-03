/**
 * Genome Kernel - Living OS Core
 * Manages genome lifecycle, enforces C0 immutability, coordinates evolution.
 *
 * @author DeepAgent (adapted from PGA Platform)
 * @since 2026-03-03
 */

import * as crypto from 'crypto';
import type {
    GenomeV2,
    Chromosome0,
    GenomeSnapshot,
} from '../types/index.js';

// ─── Security Event Types ───────────────────────────────────

interface SecurityEvent {
    level: 'info' | 'warning' | 'error' | 'critical';
    event: string;
    details: Record<string, unknown>;
    timestamp: Date;
}

interface IntegrityViolation {
    genomeId: string;
    genomeName: string;
    expected: string;
    actual: string;
    timestamp: Date;
    stackTrace?: string;
}

// ─── Genome Kernel Options ──────────────────────────────────

export interface GenomeKernelOptions {
    strictMode?: boolean;
    autoRollback?: boolean;
    maxViolations?: number;
    enableCaching?: boolean;
    cacheInvalidationMs?: number;
    onIntegrityViolation?: (violation: IntegrityViolation) => void;
    onSecurityEvent?: (event: SecurityEvent) => void;
    onQuarantine?: (genomeId: string, reason: string) => void;
}

// ─── Genome Kernel ──────────────────────────────────────────

export class GenomeKernel {
    private genome: GenomeV2;
    private c0Hash: string;
    private options: Required<GenomeKernelOptions>;
    private c0HashCache: string | null = null;
    private lastHashComputation: number = 0;
    private snapshots: GenomeSnapshot[] = [];
    private maxSnapshots = 100;

    constructor(genome: GenomeV2, options: GenomeKernelOptions = {}) {
        this.genome = genome;

        this.options = {
            strictMode: options.strictMode ?? true,
            autoRollback: options.autoRollback ?? true,
            maxViolations: options.maxViolations ?? 3,
            enableCaching: options.enableCaching ?? true,
            cacheInvalidationMs: options.cacheInvalidationMs ?? 0,
            onIntegrityViolation: options.onIntegrityViolation ?? (() => {}),
            onSecurityEvent: options.onSecurityEvent ?? (() => {}),
            onQuarantine: options.onQuarantine ?? (() => {}),
        };

        this.c0Hash = this.computeC0Hash(genome.chromosomes.c0);

        if (!genome.integrity) {
            genome.integrity = {
                c0Hash: this.c0Hash,
                lastVerified: new Date(),
                violations: 0,
                quarantined: false,
            };
        }

        this.verifyIntegrity();
    }

    // ─── C0 Integrity Verification ──────────────────────────────

    private computeC0Hash(c0: Chromosome0): string {
        const canonical = {
            identity: c0.identity,
            security: c0.security,
            attribution: c0.attribution,
        };

        const keys = Object.keys(canonical).sort();
        const sorted = keys.reduce(
            (acc, key) => {
                acc[key] = canonical[key as keyof typeof canonical];
                return acc;
            },
            {} as Record<string, unknown>
        );

        const content = JSON.stringify(sorted);
        return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    }

    public verifyIntegrity(): boolean {
        if (this.genome.integrity.quarantined) {
            this.logSecurityEvent({
                level: 'error',
                event: 'integrity_check_blocked',
                details: {
                    reason: 'Genome is quarantined',
                    genomeId: this.genome.id,
                },
                timestamp: new Date(),
            });

            if (this.options.strictMode) {
                throw new Error(
                    `Genome ${this.genome.id} is quarantined. Cannot verify integrity.`
                );
            }
            return false;
        }

        let currentHash: string;

        if (this.options.enableCaching && this.c0HashCache) {
            const now = Date.now();
            const elapsed = now - this.lastHashComputation;

            if (elapsed < this.options.cacheInvalidationMs) {
                currentHash = this.c0HashCache;
            } else {
                currentHash = this.computeC0Hash(this.genome.chromosomes.c0);
                this.c0HashCache = currentHash;
                this.lastHashComputation = now;
            }
        } else {
            currentHash = this.computeC0Hash(this.genome.chromosomes.c0);
            this.c0HashCache = currentHash;
            this.lastHashComputation = Date.now();
        }

        if (currentHash !== this.c0Hash) {
            this.handleIntegrityViolation(currentHash);
            return false;
        }

        this.genome.integrity.lastVerified = new Date();

        this.logSecurityEvent({
            level: 'info',
            event: 'integrity_verified',
            details: {
                genomeId: this.genome.id,
                hash: currentHash,
            },
            timestamp: new Date(),
        });

        return true;
    }

    private handleIntegrityViolation(actualHash: string): void {
        const violation: IntegrityViolation = {
            genomeId: this.genome.id,
            genomeName: this.genome.name,
            expected: this.c0Hash,
            actual: actualHash,
            timestamp: new Date(),
            stackTrace: new Error().stack,
        };

        this.genome.integrity.violations += 1;

        this.logSecurityEvent({
            level: 'critical',
            event: 'c0_integrity_violation',
            details: {
                genomeId: this.genome.id,
                genomeName: this.genome.name,
                expectedHash: this.c0Hash,
                actualHash: actualHash,
                violationCount: this.genome.integrity.violations,
            },
            timestamp: new Date(),
        });

        this.options.onIntegrityViolation(violation);

        if (this.genome.integrity.violations >= this.options.maxViolations) {
            this.quarantine(
                `C0 integrity violated ${this.genome.integrity.violations} times.`
            );
        }

        if (this.options.autoRollback) {
            this.rollbackToSafeVersion();
        }

        if (this.options.strictMode) {
            throw new IntegrityViolationError(
                `C0 integrity violation in genome "${this.genome.name}"`
            );
        }
    }

    // ─── Quarantine Management ──────────────────────────────────

    private quarantine(reason: string): void {
        this.genome.state = 'quarantined';
        this.genome.integrity.quarantined = true;
        this.genome.integrity.quarantineReason = reason;

        this.logSecurityEvent({
            level: 'critical',
            event: 'genome_quarantined',
            details: { genomeId: this.genome.id, reason },
            timestamp: new Date(),
        });

        this.options.onQuarantine(this.genome.id, reason);
    }

    public releaseQuarantine(authorizedBy: string): void {
        if (!this.genome.integrity.quarantined) return;

        const currentHash = this.computeC0Hash(this.genome.chromosomes.c0);
        if (currentHash !== this.c0Hash) {
            throw new Error('Cannot release: C0 integrity still violated.');
        }

        this.genome.state = 'active';
        this.genome.integrity.quarantined = false;
        this.genome.integrity.violations = 0;
        delete this.genome.integrity.quarantineReason;

        this.logSecurityEvent({
            level: 'warning',
            event: 'quarantine_released',
            details: { genomeId: this.genome.id, authorizedBy },
            timestamp: new Date(),
        });
    }

    // ─── Rollback System ────────────────────────────────────────

    public createSnapshot(reason: string): void {
        const snapshot: GenomeSnapshot = {
            genomeId: this.genome.id,
            version: this.genome.version,
            snapshot: JSON.parse(JSON.stringify(this.genome)),
            createdAt: new Date(),
            reason,
        };

        this.snapshots.push(snapshot);

        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    private rollbackToSafeVersion(): void {
        if (this.snapshots.length === 0) return;

        let safeSnapshot: GenomeSnapshot | null = null;

        for (let i = this.snapshots.length - 1; i >= 0; i--) {
            const snapshot = this.snapshots[i];
            const snapshotHash = this.computeC0Hash(snapshot.snapshot.chromosomes.c0);

            if (snapshotHash === this.c0Hash) {
                safeSnapshot = snapshot;
                break;
            }
        }

        if (!safeSnapshot) return;

        Object.assign(this.genome, safeSnapshot.snapshot);
        this.genome.version += 1;
    }

    public rollbackToVersion(version: number, authorizedBy: string): boolean {
        const snapshot = this.snapshots.find((s) => s.version === version);
        if (!snapshot) return false;

        Object.assign(this.genome, snapshot.snapshot);
        this.genome.version += 1;
        this.genome.integrity.violations = 0;
        this.genome.integrity.quarantined = false;
        delete this.genome.integrity.quarantineReason;

        this.logSecurityEvent({
            level: 'warning',
            event: 'manual_rollback',
            details: { genomeId: this.genome.id, toVersion: version, authorizedBy },
            timestamp: new Date(),
        });

        return true;
    }

    // ─── Logging ────────────────────────────────────────────────

    private logSecurityEvent(event: SecurityEvent): void {
        if (process.env.NODE_ENV !== 'production') {
            const emoji = {
                info: 'ℹ️',
                warning: '⚠️',
                error: '❌',
                critical: '🔥',
            };
            console.log(
                `${emoji[event.level]} [PGA ${event.level.toUpperCase()}] ${event.event}`,
                event.details
            );
        }
        this.options.onSecurityEvent(event);
    }

    // ─── Getters ────────────────────────────────────────────────

    public getGenome(): GenomeV2 {
        return this.genome;
    }

    public getC0Hash(): string {
        return this.c0Hash;
    }

    public getSnapshots(): GenomeSnapshot[] {
        return [...this.snapshots];
    }

    public isQuarantined(): boolean {
        return this.genome.integrity.quarantined;
    }

    public getViolationCount(): number {
        return this.genome.integrity.violations;
    }
}

// ─── Custom Errors ──────────────────────────────────────────

export class IntegrityViolationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'IntegrityViolationError';
    }
}

export class QuarantinedGenomeError extends Error {
    constructor(genomeId: string) {
        super(`Genome ${genomeId} is quarantined. Manual intervention required.`);
        this.name = 'QuarantinedGenomeError';
    }
}
