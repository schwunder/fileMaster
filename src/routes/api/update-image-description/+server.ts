import { truncateLog } from './../../../lib/utilities/string';
import { getImageDescription, getBase64Image } from '$lib/utilities/image';
import pino from 'pino';
import path from 'path';

const logger = pino();

export async function POST({ request }: { request: Request }) {
	try {
		logger.info('Received request');
		const imgPath = await request.text(); // Read the request body as plain text
		const absPath = path.resolve(process.cwd(), imgPath);

		logger.info(`Absolute path: ${absPath}`);
		logger.info(`Received image path: ${imgPath}`); // Log the received image path
		const prompt = `What's in this image? Be concise and use under 50 tokens`;
		const base64Img = await getBase64Image(imgPath);
		logger.info(truncateLog(base64Img)); // Replaced console.log with logger.info
		const description = await getImageDescription(base64Img, prompt);
		return new Response(JSON.stringify({ description }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*', // Allow all origins
				'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
				'Access-Control-Allow-Headers': 'Content-Type' // Allow Content-Type header
			}
		}); // Added semicolon here
	} catch (error) {
		return new Response(JSON.stringify({ error: (error as Error).message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*', // Allow all origins
				'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
				'Access-Control-Allow-Headers': 'Content-Type' // Allow Content-Type header
			}
		}); // Added semicolon here
	}
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*', // Allow all origins
			'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
			'Access-Control-Allow-Headers': 'Content-Type' // Allow Content-Type header
		}
	});
}
