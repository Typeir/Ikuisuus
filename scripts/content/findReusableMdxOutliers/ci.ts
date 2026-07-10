/**
 * CI Mode: Minimal MDX Components Generator
 *
 * @fileoverview Generates a minimal mdxComponents.tsx file without analyzing for reusable outliers.
 * This is used in CI environments where the full analysis step is skipped.
 *
 * @module findReusableMdxOutliers/ci
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { OUTPUT_FILE, writeCiPlaceholderModule } from './emitter';

const log = createLogger({ script: 'findReusableMdxOutliers.ci' });

const main = async (): Promise<void> => {
  await writeCiPlaceholderModule();
  log.message('✅ Generated minimal mdxComponents.tsx for CI environment', {
    path: OUTPUT_FILE,
  });
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  log.error('Failed to generate CI placeholder mdxComponents.tsx', {
    error: message,
  });
  process.exit(1);
});
