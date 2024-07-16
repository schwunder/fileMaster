import { join, relative } from 'path';
import { readdir } from 'fs/promises';

export async function listFilesImages(directoryPath: string): Promise<string[]> {
	const files = await readdir(directoryPath);
	const projectRoot = process.cwd();

	return files
		.filter((file) => file.endsWith('.png'))
		.map((file) => '/' + relative(projectRoot, join(directoryPath, file)).replace(/\\/g, '/'));
}

export async function listFilesJsons(directoryPath: string): Promise<string[]> {
	const files = await readdir(directoryPath);
	const projectRoot = process.cwd();

	return files
		.filter((file) => file.endsWith('.json'))
		.map((file) => '/' + relative(projectRoot, join(directoryPath, file)).replace(/\\/g, '/'));
}
