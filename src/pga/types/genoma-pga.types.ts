/**
 * Genoma-PGA Integration Types
 * Types specific to the Genoma + PGA integration
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { GenomeV2, FitnessVector, SelectionContext } from './GenomeV2.js';

// ─── PGA Agent Configuration ────────────────────────────────

export interface PGAAgentConfig {
    enabled: boolean;
    genomeId?: string;
    autoMutate: boolean;
    mutationInterval: number;
    fitnessThreshold: number;
    c0Strict: boolean;
}

export interface PGAIntegrationConfig {
    pga: PGAAgentConfig;
    storage: PGAStorageConfig;
    llm: PGALLMConfig;
}

export interface PGAStorageConfig {
    type: 'postgres' | 'sqlite' | 'memory';
    connectionString?: string;
    poolSize?: number;
}

export interface PGALLMConfig {
    defaultProvider: string;
    evaluatorModel?: string;
    enableSemanticJudge: boolean;
}

// ─── PGA Session ────────────────────────────────────────────

export interface PGASession {
    id: string;
    userId: string;
    genomeId: string;
    startedAt: Date;
    lastActivity: Date;
    interactionCount: number;
    currentContext: SelectionContext;
    assembledPrompt?: string;
}

export interface PGASessionMetrics {
    sessionId: string;
    avgLatency: number;
    avgFitness: FitnessVector;
    toolUsage: Record<string, number>;
    feedbackScore: number;
}

// ─── PGA Extension Bridge ───────────────────────────────────

export interface GenomaExtensionAsGene {
    extensionId: string;
    extensionName: string;
    geneCategory: string;
    geneContent: string;
    priority: number;
    enabled: boolean;
}

// ─── PGA Feedback ───────────────────────────────────────────

export interface PGAFeedback {
    id: string;
    genomeId: string;
    userId: string;
    interactionId: string;
    type: 'explicit' | 'implicit';
    sentiment: 'positive' | 'negative' | 'neutral';
    gene?: string;
    comment?: string;
    createdAt: Date;
}

export interface ImplicitFeedbackSignals {
    responseTime: number;
    followUpQuestions: number;
    regenerationRequests: number;
    sessionDuration: number;
    toolSuccessRate: number;
}

// ─── PGA Metrics ────────────────────────────────────────────

export interface PGAMetrics6D {
    accuracy: MetricValue;
    speed: MetricValue;
    cost: MetricValue;
    safety: MetricValue;
    userSatisfaction: MetricValue;
    adaptability: MetricValue;
}

export interface MetricValue {
    current: number;
    previous: number;
    delta: number;
    trend: 'up' | 'down' | 'stable';
    samples: number;
}

// ─── PGA Events ─────────────────────────────────────────────

export type PGAEventType =
    | 'genome.created'
    | 'genome.updated'
    | 'genome.quarantined'
    | 'mutation.proposed'
    | 'mutation.applied'
    | 'mutation.rejected'
    | 'fitness.updated'
    | 'immune.triggered'
    | 'inheritance.received'
    | 'c0.violation';

export interface PGAEvent {
    type: PGAEventType;
    genomeId: string;
    timestamp: Date;
    data: Record<string, unknown>;
}

export type PGAEventHandler = (event: PGAEvent) => void | Promise<void>;

// ─── Gene Registry Types ────────────────────────────────────

export interface GeneRegistryEntry {
    id: string;
    name: string;
    category: string;
    content: string;
    version: number;
    fitness: FitnessVector;
    usageCount: number;
    sourceGenomeId: string;
    sourceGenomeName: string;
    validated: boolean;
    public: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface GeneSearchQuery {
    category?: string;
    minFitness?: number;
    validated?: boolean;
    public?: boolean;
    limit?: number;
    offset?: number;
}

export interface GeneSearchResult {
    genes: GeneRegistryEntry[];
    total: number;
    page: number;
    pageSize: number;
}
