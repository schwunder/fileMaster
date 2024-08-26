import { json } from '@sveltejs/kit';
import { extractSourceMeta } from '$lib/utilities/metadata-extraction/extraction';
import * as path from 'path';
import pino from 'pino';

const logger = pino();

export async function GET() {
  const relativePath = 'db/media';
  const projectRoot = process.cwd();
  const absoluteDirectoryPath = path.resolve(projectRoot, relativePath);

  try {
    logger.info(
      { absoluteDirectoryPath },
      'Starting source metadata extraction'
    );

    const results = await extractSourceMeta(relativePath);
    logger.info(
      { resultCount: results.length },
      'Successfully extracted source metadata'
    );

    // Log the results before sending them
    logger.info(
      { results: JSON.stringify(results, null, 2) },
      'API response data'
    );

    // Wrap the results in an object
    return json({ success: true, results });
  } catch (error: unknown) {
    // Explicitly type the error as unknown
    logger.error({ error }, 'Error extracting source metadata');

    // Use type narrowing to handle the error
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json(
        { success: false, error: 'An unknown error occurred' },
        { status: 500 }
      );
    }
  }
}
