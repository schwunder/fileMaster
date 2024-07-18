import { json } from '@sveltejs/kit';
import { readJsonFiles } from '$lib/utilities/fileIO';
import { join } from 'path';

export async function GET() {
	const relativePath = 'db/jsons';
	const projectRoot = process.cwd();
	const directoryPath = join(projectRoot, relativePath);

	try {
		const jsonContents = await readJsonFiles(directoryPath);
		return json(jsonContents);
	} catch (error) {
		console.error('Error reading JSON files:', error);
		return json({ error: 'Failed to read JSON files' }, { status: 500 });
	}
}
