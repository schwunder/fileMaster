import { json } from '@sveltejs/kit';
import { extractSourceMeta } from '$lib/utilities/extraction';
import { join } from 'path';
import pino from 'pino';

const logger = pino();

export async function GET() {
  const relativePath = 'db/media';
  const projectRoot = process.cwd();
  const absoluteDirectoryPath = join(projectRoot, relativePath);

  try {
    logger.info(
      { absoluteDirectoryPath },
      'Starting source metadata extraction'
    );

    const results = await extractSourceMeta(absoluteDirectoryPath);
    logger.info(
      { resultCount: results.length },
      'Successfully extracted source metadata'
    );

    return json({ success: true, results });
  } catch (error) {
    logger.error({ error }, 'Error extracting source metadata');
    return json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
