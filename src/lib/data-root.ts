import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Absolute path into the project's data/ files.
 *
 * process.cwd() is right almost everywhere (production serverless, CLI,
 * Playwright) but wrong when a dev server is spawned from another directory
 * (e.g. the preview harness). PROJECT_ROOT — inlined from next.config.ts's
 * real location — covers that case, but is itself stale on Vercel at runtime
 * (it bakes in the build directory). So: probe for the data marker and use
 * the first root that actually has it.
 */
let _root: string | null = null;

export function dataPath(...segments: string[]): string {
  if (_root === null) {
    const candidates = [process.cwd(), process.env.PROJECT_ROOT ?? ""].filter(Boolean);
    _root =
      candidates.find((c) => existsSync(join(c, "data", "products_live.json"))) ??
      process.cwd();
  }
  return join(_root, ...segments);
}
