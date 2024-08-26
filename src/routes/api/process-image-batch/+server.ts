import { processImages } from '$lib/utilities/image-processing/image';
import pino from 'pino';

const logger = pino();

export async function POST({ request }: { request: Request }) {
  try {
    logger.info('Received request');
    const { paths, sampleTags } = await request.json(); // Read the request body as plain text
    logger.info(`Received image path: ${paths[0]}`); // Log the received image path
    const imageMetas = await processImages(paths, sampleTags); // Process the image and get metadata
    return new Response(JSON.stringify({ success: true, data: imageMetas }), {
      // Include imageMeta in the response
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
      },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Allow all origins
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS methods
      'Access-Control-Allow-Headers': 'Content-Type', // Allow Content-Type header
    },
  });
}
