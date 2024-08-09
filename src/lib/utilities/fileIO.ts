import { join, relative } from 'path';
import { readdir, readFile } from 'fs/promises';
import type { imageMeta } from '$lib/schemas';
import fg from 'fast-glob';
import { promises as fs } from 'fs';
import path from 'path';
import pino from 'pino';
import { promisify } from 'util';
import { exec } from 'child_process';
// import sharp from 'sharp';

const logger = pino();
const execAsync = promisify(exec);

export async function listFilesImages(
  directoryPath: string
): Promise<string[]> {
  const files = await readdir(directoryPath);
  const projectRoot = process.cwd();

  return files
    .filter((file) => /\.(png|jpg|jpeg|heic|heif)$/i.test(file))
    .map(
      (file) =>
        '/' +
        relative(projectRoot, join(directoryPath, file)).replace(/\\/g, '/')
    );
}

interface ImageMetaWithPath {
  filePath: string;
  metadata: imageMeta[];
}

export async function readJsonFiles(
  directoryPath: string
): Promise<ImageMetaWithPath[]> {
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

// Function to get the MIME type of a file
async function getFileType(filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`file -b --mime-type "${filePath}"`);
    return stdout.trim();
  } catch (error) {
    logger.error(`Error getting file type: ${error}`);
    return 'unknown';
  }
}

// Function to get the correct file extension based on MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return mimeToExt[mimeType] || '.unknown';
}

async function copyFile(
  sourcePath: string,
  destDir: string
): Promise<string | null> {
  const fileType = await getFileType(sourcePath);
  const correctExtension = getExtensionFromMimeType(fileType);
  const fileName =
    path.basename(sourcePath, path.extname(sourcePath)) + correctExtension;
  const destPath = path.join(destDir, fileName);

  try {
    await fs.copyFile(sourcePath, destPath);
    if (!(await verifyFileIntegrity(sourcePath, destPath))) {
      return null;
    }
    logger.info(`Successfully copied ${sourcePath} to ${destPath}`);
    return destPath;
  } catch (error) {
    logger.error(`Error processing file ${sourcePath}: ${error}`);
    return null;
  }
}

async function verifyFileIntegrity(
  sourcePath: string,
  destPath: string
): Promise<boolean> {
  const sourceStats = await fs.stat(sourcePath);
  const destStats = await fs.stat(destPath);
  if (sourceStats.size !== destStats.size) {
    logger.error(
      `File size mismatch for ${sourcePath}. Source: ${sourceStats.size}, Destination: ${destStats.size}`
    );
    return false;
  }
  return true;
}

export async function copyToDB(
  absoluteDirectoryPath: string
): Promise<string[]> {
  const destDir = 'db/media';
  await fs.mkdir(destDir, { recursive: true });

  logger.info(`Searching for image files in ${absoluteDirectoryPath}`);

  // Example: Find recent large images
  // const recentLargeImages = await fg('**/*.{png,jpg,webp}', {
  //   cwd: absoluteDirectoryPath,
  //   stats: true,
  //   filter: f => f.stats.size > 1_000_000 && Date.now() - f.stats.mtime.getTime() < 7 * 24 * 60 * 60 * 1000
  // });
  // Uncomment to exclude specific directories:
  // ignore: ['**/excluded/**', '**/temp/**'],
  // Uncomment to limit search depth:
  // deep: 3,
  const imageFiles = await fg('**/*.{png,jpg,jpeg,heic,heif}', {
    cwd: absoluteDirectoryPath,
    absolute: true,
    caseSensitiveMatch: false,
  });
  logger.info(`Found ${imageFiles.length} image files`);

  const copiedFiles = await Promise.all(
    imageFiles.map((file) => copyFile(file, destDir))
  );
  const successfulCopies = copiedFiles.filter(Boolean) as string[];

  logger.info(
    `Successfully processed ${successfulCopies.length} out of ${imageFiles.length} files`
  );

  return successfulCopies;
}

// Implemented conversion functions
/*
async function convertHeicToJpeg(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    await sharp(inputPath).jpeg({ quality: 90 }).toFile(outputPath);
    logger.info(`Converted ${inputPath} to JPEG: ${outputPath}`);
  } catch (error) {
    logger.error(`Error converting HEIC to JPEG: ${error}`);
    throw error;
  }
}

async function convertToPng(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    await sharp(inputPath).png().toFile(outputPath);
    logger.info(`Converted ${inputPath} to PNG: ${outputPath}`);
  } catch (error) {
    logger.error(`Error converting to PNG: ${error}`);
    throw error;
  }
}

// New function to convert any supported image to WebP
async function convertToWebP(
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<void> {
  try {
    await sharp(inputPath).webp({ quality }).toFile(outputPath);
    logger.info(`Converted ${inputPath} to WebP: ${outputPath}`);
  } catch (error) {
    logger.error(`Error converting to WebP: ${error}`);
    throw error;
  }
}

// New function to resize an image
async function resizeImage(
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize(width, height, { fit: 'inside', withoutEnlargement: true })
      .toFile(outputPath);
    logger.info(`Resized ${inputPath} to ${width}x${height}: ${outputPath}`);
  } catch (error) {
    logger.error(`Error resizing image: ${error}`);
    throw error;
  }
}
*/
