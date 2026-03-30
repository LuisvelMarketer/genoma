/**
 * GSEP Types — compatibility layer for Genome security modules
 *
 * These types were previously in src/pga/types/.
 * They will be replaced by @gsep/core types when full integration is done.
 */

export interface OperativeGene {
  id: string;
  name: string;
  content: string;
  category: string;
  fitness: number;
  generation: number;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
}

export interface FitnessVector {
  accuracy: number;
  speed: number;
  cost: number;
  safety: number;
  userSatisfaction: number;
  adaptability: number;
}

export interface GenomeV2 {
  id: string;
  name: string;
  version: number;
  c0: {
    identity: string;
    ethics: string[];
    security: string[];
    hash: string;
  };
  c1: {
    operativeGenes: OperativeGene[];
  };
  c2: {
    userEpigenome: Record<string, unknown>;
    contextPatterns: string[];
    learnedBehaviors: string[];
  };
  fitness: FitnessVector;
  createdAt: Date;
  updatedAt: Date;
}
