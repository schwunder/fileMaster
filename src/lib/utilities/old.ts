import fg from 'fast-glob';
import { promises as fs } from 'fs';
import path from 'path';
import { pipe } from './promise';

//todo given tags in payload
//todo given tags in payload
//todo add other file types and categorize ui based on file type
//also just display pdf like image
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

export async function postImageDetails(
	imageDetails: {
		imgPath: string;
		tags: string[];
		title: string;
		description: string;
		matchingTags: string[];
		timeStamp: number;
	}[]
) {
	// return Promise.all(imageDetails.map((imageDetail) => DB({ method: 'POST', body: imageDetail })));
	// write to convex
	return imageDetails;
}

export async function folderToDB(absoluteDirectoryPath: string /*matchingTags: string[]*/) {
	return await pipe(absoluteDirectoryPath, [
		// copyToDB
		// (filePaths: string[]) => processImages(filePaths, matchingTags), // Explicitly typed
		// postImageDetails
	]);
}
