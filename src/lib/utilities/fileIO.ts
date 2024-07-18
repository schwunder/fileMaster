import { join, relative } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { imageMeta } from '$lib/schemas'; // Use type-only import

export async function listFilesImages(directoryPath: string): Promise<string[]> {
	const files = await readdir(directoryPath);
	const projectRoot = process.cwd();

	return files
		.filter((file) => file.endsWith('.png'))
		.map((file) => '/' + relative(projectRoot, join(directoryPath, file)).replace(/\\/g, '/'));
}

interface ImageMetaWithPath {
	filePath: string;
	metadata: imageMeta[];
}

export async function readJsonFiles(directoryPath: string): Promise<ImageMetaWithPath[]> {
	const files = await readdir(directoryPath);
	const jsonFiles = files.filter((file) => file.endsWith('.json'));

	const jsonContents = await Promise.all(
		jsonFiles.map(async (file) => {
			const filePath = join(directoryPath, file);
			const content = await readFile(filePath, 'utf-8');
			const metadata = JSON.parse(content) as imageMeta[];
			return { filePath, metadata };
		})
	);

	return jsonContents;
}
