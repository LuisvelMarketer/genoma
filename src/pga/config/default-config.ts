/**
 * Default PGA Configuration for Genoma
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { PGAIntegrationConfig, FitnessWeights, GenomeConfig } from '../types/index.js';

/**
 * Default PGA agent configuration
 */
export const DEFAULT_PGA_AGENT_CONFIG = {
    enabled: true,
    autoMutate: true,
    mutationInterval: 100,
    fitnessThreshold: 0.7,
    c0Strict: true,
};

/**
 * Default storage configuration
 */
export const DEFAULT_STORAGE_CONFIG = {
    type: 'memory' as const,
    poolSize: 10,
};

/**
 * Default LLM configuration
 */
export const DEFAULT_LLM_CONFIG = {
    defaultProvider: 'anthropic',
    evaluatorModel: 'claude-3-haiku',
    enableSemanticJudge: true,
};

/**
 * Default fitness weights (6D)
 */
export const DEFAULT_FITNESS_WEIGHTS: FitnessWeights = {
    accuracy: 0.25,
    speed: 0.15,
    cost: 0.15,
    safety: 0.20,
    userSatisfaction: 0.15,
    adaptability: 0.10,
};

/**
 * Default genome configuration
 */
export const DEFAULT_GENOME_CONFIG: GenomeConfig = {
    mutationRate: 'balanced',
    epsilonExplore: 0.1,
    enableSandbox: true,
    sandboxModel: 'claude-3-haiku',
    fitnessWeights: DEFAULT_FITNESS_WEIGHTS,
    minFitnessImprovement: 0.05,
    enableIntegrityCheck: true,
    autoRollbackThreshold: 0.15,
    allowInheritance: true,
    minCompatibilityScore: 0.6,
};

/**
 * Complete default integration config
 */
export const DEFAULT_INTEGRATION_CONFIG: PGAIntegrationConfig = {
    pga: DEFAULT_PGA_AGENT_CONFIG,
    storage: DEFAULT_STORAGE_CONFIG,
    llm: DEFAULT_LLM_CONFIG,
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS = {
    development: {
        ...DEFAULT_INTEGRATION_CONFIG,
        pga: {
            ...DEFAULT_PGA_AGENT_CONFIG,
            mutationInterval: 10, // More frequent for testing
        },
    },
    production: {
        ...DEFAULT_INTEGRATION_CONFIG,
        pga: {
            ...DEFAULT_PGA_AGENT_CONFIG,
            mutationInterval: 500, // Less frequent in production
            c0Strict: true,
        },
        storage: {
            type: 'postgres' as const,
            poolSize: 20,
        },
    },
    testing: {
        ...DEFAULT_INTEGRATION_CONFIG,
        pga: {
            ...DEFAULT_PGA_AGENT_CONFIG,
            enabled: false, // Disabled for tests by default
        },
        storage: {
            type: 'memory' as const,
            poolSize: 1,
        },
    },
};

/**
 * Get configuration for current environment
 */
export function getConfigForEnvironment(env?: string): PGAIntegrationConfig {
    const environment = env || process.env.NODE_ENV || 'development';

    switch (environment) {
        case 'production':
            return ENVIRONMENT_CONFIGS.production;
        case 'test':
        case 'testing':
            return ENVIRONMENT_CONFIGS.testing;
        default:
            return ENVIRONMENT_CONFIGS.development;
    }
}
