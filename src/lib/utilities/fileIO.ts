import { join, relative } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { imageMeta } from '$lib/schemas'; // Use type-only import
import fg from 'fast-glob';
import { promises as fs } from 'fs';
import path from 'path';

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

export async function copyToDB(absoluteDirectoryPath: string) {
	try {
		const destDir = 'db/media';
		await fs.mkdir(destDir, { recursive: true });

		// Use fast-glob for powerful file matching
		const pngFiles = await fg('**/*.png', {
			cwd: absoluteDirectoryPath,
			absolute: true
			// Uncomment to exclude specific directories:
			// ignore: ['**/excluded/**', '**/temp/**'],
			// Uncomment to limit search depth:
			// deep: 3,
		});

		// Copy matched files
		await Promise.all(
			pngFiles.map(async (file) => {
				const destPath = path.join(destDir, path.basename(file));
				await fs.copyFile(file, destPath);
			})
		);

		// Example: Find recent large images
		// const recentLargeImages = await fg('**/*.{png,jpg,webp}', {
		//   cwd: absoluteDirectoryPath,
		//   stats: true,
		//   filter: f => f.stats.size > 1_000_000 && Date.now() - f.stats.mtime.getTime() < 7 * 24 * 60 * 60 * 1000
		// });

		// Read the files in the destination directory
		const files = await fs.readdir(destDir);

		// Return the list of copied .png files
		return files.filter((file) => file.endsWith('.png')).map((file) => path.join(destDir, file));
	} catch (error) {
		throw new Error(`Error copying files to DB: ${error}`);
	}
}
