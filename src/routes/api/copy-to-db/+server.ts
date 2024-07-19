import { copyToDB } from '../../../lib/utilities/fileIO';
import pino from 'pino';

const logger = pino();

export async function POST({ request }: { request: Request }) {
	try {
		const { absoluteDirectoryPath } = await request.json();
		logger.info({ absoluteDirectoryPath }, 'Received request to copy directory to DB');
		await copyToDB(absoluteDirectoryPath);
		logger.info('Successfully copied directory to DB');
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (error) {
		logger.error({ error }, 'Error copying directory to DB');
		return new Response(JSON.stringify({ success: false, error: 'Internal Server Error' }), {
			status: 500
		});
	}
}
