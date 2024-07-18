import { processImage } from '$lib/utilities/image';
import pino from 'pino';

const logger = pino();

export async function POST({ request }: { request: Request }) {
	try {
		logger.info('Received request');
		const { path, sampleTags } = await request.json(); // Read the request body as plain text
		logger.info(`Received image path: ${path}`); // Log the received image path
		const imageMeta = await processImage(path, sampleTags); // Process the image and get metadata
		return new Response(JSON.stringify({ success: true, data: imageMeta }), {
			// Include imageMeta in the response
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*', // Allow all origins
				'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
				'Access-Control-Allow-Headers': 'Content-Type' // Allow Content-Type header
			}
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: (error as Error).message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*', // Allow all origins
				'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
				'Access-Control-Allow-Headers': 'Content-Type' // Allow Content-Type header
			}
		});
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
