import { json } from '@sveltejs/kit';
import { listFilesImages } from '$lib/utilities/filesys';
import { join } from 'path';

export async function GET() {
	const relativePath = 'db/media';
	const projectRoot = process.cwd();
	const directoryPath = join(projectRoot, relativePath);

	try {
		const files = await listFilesImages(directoryPath);
		return json({ files });
	} catch (error) {
		console.error('Error scanning directory:', error);
		return json({ error: 'Failed to scan directory' }, { status: 500 });
	}
}
