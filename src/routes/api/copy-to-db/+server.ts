import { copyToDB } from '../../../lib/utilities/fileIO';
import pino from 'pino';

const logger = pino();

export async function POST({ request }: { request: Request }) {
  try {
    const { absoluteDirectoryPath } = await request.json();
    logger.info(
      { absoluteDirectoryPath },
      'Received request to copy directory to DB'
    );

    // Copy files to the DB and get the list of newly copied files
    const newFiles = await copyToDB(absoluteDirectoryPath);

    logger.info(
      { newFilesCount: newFiles.length },
      'Successfully copied new files to DB'
    );

    // Return the list of newly copied files in the response
    return new Response(JSON.stringify({ success: true, newFiles }), {
      status: 200,
    });
  } catch (error) {
    logger.error({ error }, 'Error copying directory to DB');
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error' }),
      {
        status: 500,
      }
    );
  }
}
