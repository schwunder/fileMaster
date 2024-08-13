import { join, relative, basename, extname } from 'path';
import {
  readdir,
  readFile,
  stat,
  writeFile,
  copyFile,
  mkdir,
} from 'fs/promises';
import type { imageMeta } from '$lib/schemas';
import pino from 'pino';
import fg from 'fast-glob';
import decode from 'heic-decode';
import convert from 'heic-convert';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

// Logger instance
const logger = pino();

// Interface for image metadata with file path
interface ImageMetaWithPath {
  filePath: string;
  metadata: imageMeta[];
}

// List image files in a directory
export const listFilesImages = async (
  directoryPath: string
): Promise<string[]> => {
  const files = await readdir(directoryPath);
  const projectRoot = process.cwd();

  return files
    .filter((file) => /\.(png|jpg|jpeg|heic|heif)$/i.test(file))
    .map(
      (file) =>
        '/' +
        relative(projectRoot, join(directoryPath, file)).replace(/\\/g, '/')
    );
};

// Read JSON files and parse their content
export const readJsonFiles = async (
  directoryPath: string
): Promise<ImageMetaWithPath[]> => {
  const files = await readdir(directoryPath);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  return await Promise.all(
    jsonFiles.map(async (file) => {
      const filePath = join(directoryPath, file);
      const content = await readFile(filePath, 'utf-8');
      const metadata = JSON.parse(content) as imageMeta[];
      return { filePath, metadata };
    })
  );
};

// Determine file type from buffer
const determineFileType = async (buffer: Buffer): Promise<string> => {
  return await fileTypeFromBuffer(buffer)
    .catch((error) => {
      logger.error(`Error determining file type: ${error}`);
      return null;
    })
    .then((type) => type?.mime ?? 'unknown');
};

// Get file type with error handling
const getFileType = async (filePath: string): Promise<string> => {
  const buffer = await readFileBuffer(filePath);
  if (!buffer) {
    return 'unknown';
  }
  return await determineFileType(buffer);
};

// Map MIME type to file extension
const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/heic': '.heic',
    'image/heif': '.heif',
  };
  return mimeToExt[mimeType] || '.unknown';
};

// Copy file to destination with error handling
const copyFileToDestination = async (
  sourcePath: string,
  destPath: string
): Promise<boolean> => {
  return await copyFile(sourcePath, destPath)
    .then(() => true)
    .catch((error) => {
      logger.error(
        `Error copying file from ${sourcePath} to ${destPath}: ${error}`
      );
      return false;
    });
};

// Log error and return false
const logAndReturnFalse = (message: string): boolean => {
  logger.error(message);
  return false;
};

// Copy file with integrity check
const copyFileWithIntegrityCheck = async (
  sourcePath: string,
  destPath: string
): Promise<boolean> => {
  const copySuccess = await copyFileToDestination(sourcePath, destPath);
  if (!copySuccess) {
    return logAndReturnFalse(
      `Error copying file from ${sourcePath} to ${destPath}`
    );
  }
  return verifyFileIntegrity(sourcePath, destPath).catch((error) =>
    logAndReturnFalse(
      `Error verifying file integrity for ${sourcePath}: ${error}`
    )
  );
};

// Copy and verify file
const copyAndVerify = async (
  sourcePath: string,
  destPath: string
): Promise<boolean> => {
  return copyFileWithIntegrityCheck(sourcePath, destPath);
};

// Validate file copy
const validateCopy = async (
  sourcePath: string,
  destPath: string
): Promise<boolean> => {
  return copyAndVerify(sourcePath, destPath);
};

// Get destination path for file
const getDestinationPath = (
  sourcePath: string,
  destDir: string,
  fileType: string
): string => {
  const correctExtension = getExtensionFromMimeType(fileType);
  const fileName = basename(sourcePath, extname(sourcePath)) + correctExtension;
  return join(destDir, fileName);
};

// Process HEIC file
const processHeicFile = async (
  fileType: string,
  sourcePath: string,
  destDir: string
): Promise<void> => {
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    await decodeAndSaveHeicRawData(sourcePath, destDir).catch(
      (error: unknown) => {
        logger.error(`Error processing HEIC file ${sourcePath}: ${error}`);
      }
    );
  }
};

// Handle file type error
const handleFileTypeError = (sourcePath: string, error: unknown): string => {
  logger.error(
    `Error getting file type for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`
  );
  return 'unknown';
};

// Get file type with error handling
const getFileTypeWithErrorHandling = async (
  sourcePath: string
): Promise<string> => {
  return await getFileType(sourcePath).catch((error: unknown) =>
    handleFileTypeError(sourcePath, error)
  );
};

// Copy and process file
const copyAndProcessFile = async (
  sourcePath: string,
  destDir: string
): Promise<string | null> => {
  const fileType = await getFileTypeWithErrorHandling(sourcePath);
  const destPath = getDestinationPath(sourcePath, destDir, fileType);

  if (!(await validateCopy(sourcePath, destPath))) {
    return null;
  }

  logger.info(`Successfully copied ${sourcePath} to ${destPath}`);

  // Process HEIC files
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    await processHeicFile(fileType, sourcePath, destDir);
  }

  return destPath;
};

// Verify file integrity
const verifyFileIntegrity = async (
  sourcePath: string,
  destPath: string
): Promise<boolean> => {
  const [sourceStats, destStats] = await Promise.all([
    stat(sourcePath),
    stat(destPath),
  ]);
  if (sourceStats.size !== destStats.size) {
    logger.error(
      `File size mismatch for ${sourcePath}. Source: ${sourceStats.size}, Destination: ${destStats.size}`
    );
    return false;
  }
  return true;
};

// Read file buffer with error handling
const readFileBuffer = async (filePath: string): Promise<Buffer | null> => {
  try {
    return await readFile(filePath);
  } catch (error) {
    logger.error(`Error reading file at ${filePath}: ${error}`);
    return null;
  }
};

// Define our own DecodedImage interface
interface DecodedImage {
  width: number;
  height: number;
  data: ArrayBuffer;
}

// Decode HEIC image
const decodeHeicImage = async (
  buffer: Buffer
): Promise<DecodedImage | null> => {
  try {
    return (await decode({ buffer })) as DecodedImage;
  } catch (error) {
    logger.error(`Error decoding HEIC image: ${error}`);
    return null;
  }
};

// Create raw data object from decoded image
const createRawDataObject = (image: DecodedImage): RawData => ({
  data: Array.from(new Uint8Array(image.data)),
  width: image.width,
  height: image.height,
});

// Save raw data to file
const saveRawDataToFile = async (
  rawData: RawData,
  sourcePath: string,
  destDir: string
): Promise<string | null> => {
  const rawDataPath = generateRawDataPath(sourcePath, destDir);
  const saveSuccess = await writeRawDataToFile(rawData, rawDataPath);
  return saveSuccess ? rawDataPath : null;
};

const generateRawDataPath = (sourcePath: string, destDir: string): string => {
  const rawDataFileName = basename(sourcePath, extname(sourcePath)) + '.raw';
  return join(destDir, rawDataFileName);
};

const writeRawDataToFile = async (
  rawData: RawData,
  filePath: string
): Promise<boolean> => {
  try {
    await writeFile(filePath, JSON.stringify(rawData));
    logger.info(`Saved raw pixel data to ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Error saving raw data to ${filePath}: ${error}`);
    return false;
  }
};

// Type definition for raw data
interface RawData {
  data: number[];
  width: number;
  height: number;
}

// Copy files to database
export const copyToDB = async (
  absoluteDirectoryPath: string
): Promise<string[]> => {
  const destDir = 'db/media';
  await mkdir(destDir, { recursive: true });

  logger.info(`Searching for image files in ${absoluteDirectoryPath}`);

  const imageFiles = await fg('**/*.{png,jpg,jpeg,heic,heif}', {
    cwd: absoluteDirectoryPath,
    absolute: true,
    caseSensitiveMatch: false,
  });
  logger.info(`Found ${imageFiles.length} image files`);

  const copiedFiles = await Promise.all(
    imageFiles.map((file) => copyAndProcessFile(file, destDir))
  );
  const successfulCopies = copiedFiles.filter(Boolean) as string[];

  logger.info(
    `Successfully processed ${successfulCopies.length} out of ${imageFiles.length} files`
  );

  return successfulCopies;
};

// Read file and handle errors
const readFileWithErrorHandling = async (
  inputPath: string
): Promise<Buffer> => {
  return await readFile(inputPath).catch((error) => {
    logger.error(`Error reading file at ${inputPath}: ${error}`);
    throw error;
  });
};

// Function to ensure the conversion result is a Buffer
const ensureBuffer = (conversionResult: ArrayBuffer | Buffer): Buffer => {
  if (conversionResult instanceof ArrayBuffer) {
    return Buffer.from(conversionResult);
  }
  return conversionResult as Buffer; // Assuming this is already a Buffer
};

// Function to handle conversion errors
const handleConversionError = (error: unknown): never => {
  if (error instanceof Error) {
    logger.error(`Error converting HEIC to JPEG: ${error.message}`);
  } else {
    logger.error(`Error converting HEIC to JPEG: ${String(error)}`);
  }
  throw new Error('Conversion failed');
};

// Modularized HEIC to JPEG conversion function
const convertHeicBufferToJpeg = async (
  inputBuffer: Buffer
): Promise<Buffer | undefined> => {
  try {
    const conversionResult = await convert({
      buffer: inputBuffer,
      format: 'JPEG',
      quality: 1,
    });
    return ensureBuffer(conversionResult);
  } catch (error) {
    handleConversionError(error);
    return undefined; // Explicitly return undefined for clarity
  }
};

// Save buffer to file
const saveBufferToFile = async (
  outputBuffer: Buffer,
  outputPath: string
): Promise<void> => {
  try {
    await sharp(outputBuffer).toFile(outputPath);
    logger.info(`Saved converted image to ${outputPath}`);
  } catch (error) {
    logger.error(`Error saving file to ${outputPath}: ${error}`);
    throw error;
  }
};

// Convert HEIC to JPEG
export const convertHeicToJpeg = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  const inputBuffer = await readFileWithErrorHandling(inputPath);
  const outputBuffer = await convertHeicBufferToJpeg(inputBuffer);

  // Check if outputBuffer is undefined before proceeding
  if (!outputBuffer) {
    logger.error(
      `Conversion failed for ${inputPath}, output buffer is undefined.`
    );
    throw new Error('Conversion failed, output buffer is undefined.');
  }

  await saveBufferToFile(outputBuffer, outputPath).catch((error) => {
    logger.error(`Error saving file to ${outputPath}: ${error}`);
    throw error;
  });
};

// Convert image to PNG
export const convertToPng = async (
  inputPath: string,
  outputPath: string
): Promise<void> => {
  return sharp(inputPath)
    .png()
    .toFile(outputPath)
    .then(() => logger.info(`Converted ${inputPath} to PNG: ${outputPath}`))
    .catch((error) => {
      logger.error(`Error converting to PNG: ${error}`);
      throw error;
    });
};

// Convert image to WebP
export const convertToWebP = async (
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<void> => {
  return sharp(inputPath)
    .webp({ quality })
    .toFile(outputPath)
    .then(() => logger.info(`Converted ${inputPath} to WebP: ${outputPath}`))
    .catch((error) => {
      logger.error(`Error converting to WebP: ${error}`);
      throw error;
    });
};

// Resize image
export const resizeImage = async (
  inputPath: string,
  outputPath: string,
  width: number,
  height: number
): Promise<void> => {
  return sharp(inputPath)
    .resize(width, height, { fit: 'inside', withoutEnlargement: true })
    .toFile(outputPath)
    .then(() =>
      logger.info(`Resized ${inputPath} to ${width}x${height}: ${outputPath}`)
    )
    .catch((error) => {
      logger.error(`Error resizing image: ${error}`);
      throw error;
    });
};

// Move this function declaration to the top of the file
const decodeAndSaveHeicRawData = async (
  sourcePath: string,
  destDir: string
): Promise<string | null> => {
  const imgBuffer = await readFileBuffer(sourcePath);
  if (!imgBuffer) return null;

  const rawData = await decodeHeicToRawData(imgBuffer);
  if (!rawData) return null;

  return saveRawDataToFile(rawData, sourcePath, destDir);
};

const decodeHeicToRawData = async (buffer: Buffer): Promise<RawData | null> => {
  const decodedImage = await decodeHeicImage(buffer);
  if (!decodedImage) return null;
  return createRawDataObject(decodedImage);
};
