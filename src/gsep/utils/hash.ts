/**
 * Hash utilities — compatibility layer
 * Will be replaced by @gsep/core utilities when integrated.
 */

import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}
