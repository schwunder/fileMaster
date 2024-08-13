import { join, relative, basename, extname } from 'path';
import {
  readdir,
  readFile,
  stat,
  writeFile,
  copyFile,
  mkdir,
  unlink,
} from 'fs/promises';
import type { imageMeta } from '$lib/schemas';
import pino from 'pino';
import fg from 'fast-glob';
import decode from 'heic-decode';
import convert from 'heic-convert';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { createHash } from 'crypto';

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
): Promise<string | null> => {
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    try {
      logger.info(`Attempting to convert ${sourcePath} to AVIF`);
      const avifPath = await saveAsAvif(sourcePath, destDir);
      if (!avifPath) {
        logger.error(
          `AVIF conversion failed for ${sourcePath}. Check previous error logs for details.`
        );
        return null;
      } else {
        logger.info(`Successfully saved AVIF for ${sourcePath} at ${avifPath}`);
        return avifPath;
      }
    } catch (error) {
      logger.error(
        `Unexpected error during HEIC processing for ${sourcePath}: ${error}`
      );
      return null;
    }
  }
  logger.info(`File ${sourcePath} is not HEIC/HEIF. Skipping conversion.`);
  return sourcePath; // Return the original path if not HEIC/HEIF
};

// Save as AVIF
const saveAsAvif = async (
  sourcePath: string,
  destDir: string
): Promise<string | null> => {
  const avifFileName = basename(sourcePath, extname(sourcePath)) + '.avif';
  const avifPath = join(destDir, avifFileName);

  try {
    // Read the HEIC file
    const fileContent = await readFile(sourcePath);

    // Decode the HEIC file
    const decodedImage = await decode({ buffer: fileContent });

    // Create a Sharp instance from the decoded data
    const sharpInstance = sharp(decodedImage.data, {
      raw: {
        width: decodedImage.width,
        height: decodedImage.height,
        channels: 4, // Assuming RGBA
      },
    });

    // Convert to AVIF and save
    await sharpInstance.avif({ quality: 100 }).toFile(avifPath);

    const fileStats = await stat(avifPath);
    if (fileStats.size === 0) {
      throw new Error('Saved AVIF file is empty');
    }

    logger.info(`Saved HEIC as AVIF: ${avifPath} (${fileStats.size} bytes)`);
    return avifPath;
  } catch (error) {
    let errorMessage = `Error saving HEIC as AVIF: ${error}`;
    if (error instanceof Error) {
      errorMessage += `\nError name: ${error.name}\nError message: ${error.message}`;
      if (error.stack) {
        errorMessage += `\nStack trace: ${error.stack}`;
      }
    }

    // Add more context to the error message
    errorMessage += `\nSource file: ${sourcePath}`;
    errorMessage += `\nDestination file: ${avifPath}`;

    try {
      const sourceStats = await stat(sourcePath);
      errorMessage += `\nSource file size: ${sourceStats.size} bytes`;
    } catch (statError) {
      errorMessage += `\nUnable to get source file stats: ${statError}`;
    }

    logger.error(errorMessage);

    // Attempt to get more information about the source file
    try {
      const metadata = await sharp(sourcePath).metadata();
      logger.info(`Source file metadata: ${JSON.stringify(metadata, null, 2)}`);
    } catch (metadataError) {
      logger.error(`Unable to get source file metadata: ${metadataError}`);
    }

    try {
      await unlink(avifPath).catch(() => {}); // Ignore errors when deleting
    } catch (unlinkError) {
      logger.error(`Error deleting failed AVIF file: ${unlinkError}`);
    }
    return null;
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
): Promise<{ original: string | null; processed: string | null }> => {
  const fileType = await getFileTypeWithErrorHandling(sourcePath);
  const destPath = getDestinationPath(sourcePath, destDir, fileType);

  if (!(await validateCopy(sourcePath, destPath))) {
    return { original: null, processed: null };
  }
  logger.info(`Successfully copied ${sourcePath} to ${destPath}`);

  let processedPath = null;

  // Process HEIC/HEIF files using the existing special algorithm
  if (fileType === 'image/heic' || fileType === 'image/heif') {
    processedPath = await processHeicFile(fileType, destPath, destDir);
  } else {
    // For all other supported image types, convert to AVIF
    processedPath = await convertToAvif(destPath, destDir);
  }

  if (processedPath) {
    logger.info(`Processed ${destPath} to ${processedPath}`);
  }

  return { original: destPath, processed: processedPath };
};

// New function to convert images to AVIF
const convertToAvif = async (
  inputPath: string,
  destDir: string
): Promise<string | null> => {
  const avifFileName = basename(inputPath, extname(inputPath)) + '.avif';
  const avifPath = join(destDir, avifFileName);

  try {
    await sharp(inputPath)
      .avif({ quality: 80 }) // You can adjust the quality as needed
      .toFile(avifPath);

    const fileStats = await stat(avifPath);
    if (fileStats.size === 0) {
      throw new Error('Saved AVIF file is empty');
    }

    logger.info(`Converted to AVIF: ${avifPath} (${fileStats.size} bytes)`);
    return avifPath;
  } catch (error) {
    logger.error(`Error converting ${inputPath} to AVIF: ${error}`);
    return null;
  }
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

// New function to calculate file hash
const calculateFileHash = async (filePath: string): Promise<string> => {
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
};

// Modified copyToDB function
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

  const processedHashes = new Set<string>();
  const originalCopies: string[] = [];

  for (const file of imageFiles) {
    const fileHash = await calculateFileHash(file);
    if (!processedHashes.has(fileHash)) {
      const result = await copyAndProcessFile(file, destDir);
      if (result.original) {
        originalCopies.push(result.original);
        processedHashes.add(fileHash);
      }
    } else {
      logger.info(`Skipping duplicate file: ${file}`);
    }
  }

  logger.info(
    `Successfully processed ${originalCopies.length} out of ${imageFiles.length} files`
  );
  logger.info(`Original copied files: ${originalCopies.join(', ')}`);

  return originalCopies;
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
export const decodeAndSaveHeicRawData = async (
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
