/**
 * Storage Adapter interface — compatibility layer
 * Will be replaced by @gsep/core StorageAdapter when integrated.
 */

import type { GenomeV2 } from "../types/index.js";

export interface StorageAdapter {
  loadGenome(id: string): Promise<GenomeV2 | null>;
  saveGenome(genome: GenomeV2): Promise<void>;
  listGenomes(): Promise<GenomeV2[]>;
  deleteGenome(id: string): Promise<void>;
}
