import { ExifTool } from 'exiftool-vendored';
import * as path from 'path';
import { readdir, readFile } from 'fs/promises';
import { exec } from 'child_process';
import * as mm from 'music-metadata';
import nodeId3 from 'node-id3';
import { PDFDocument } from 'pdf-lib';
import * as xattr from 'node-xattr';
import pino from 'pino';
import bplist from 'bplist-parser';
import { Buffer } from 'buffer';
import fs from 'fs/promises';

// Logger setup
const logger = pino();

// Type definitions
export type MetadataValue =
  | string
  | number
  | Date
  | boolean
  | null
  | Buffer
  | AppleProvenanceData
  | MetadataValue[];

// Define possible types for binary plist values
type BPlistValue =
  | string
  | number
  | boolean
  | Date
  | Buffer
  | BPlistArray
  | BPlistDictionary;
type BPlistArray = BPlistValue[];
interface BPlistDictionary {
  [key: string]: BPlistValue;
}

export interface AppleProvenanceData {
  rawData: string;
  parsedData?: Record<string, unknown>;
  error?: string;
  OriginatorName?: string;
  OriginatorIdentifier?: string;
  DownloadURL?: string;
  DownloadDate?: string;
  QuarantineAgentName?: string;
  QuarantineAgentBundleIdentifier?: string;
  QuarantineTimeStamp?: string;
}

export type Metadata = Record<string, MetadataValue>;
export type SourceMeta = Array<{
  filePath: string;
  relativePath: string;
  metadata: Metadata;
}>;

// Utility functions
const isPrimitiveValue = (value: unknown): value is MetadataValue => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  );
};

const parsePrimitiveValue = (value: unknown): MetadataValue | undefined => {
  return isPrimitiveValue(value) ? value : undefined;
};

const parseDateString = (value: string): MetadataValue => {
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date;
};

const parseStringValue = (value: unknown): MetadataValue | undefined => {
  return typeof value === 'string' ? parseDateString(value) : undefined;
};

const parseNullOrUndefined = (value: unknown): MetadataValue | undefined => {
  return value === null || value === undefined ? null : undefined;
};

const parseObjectValue = (value: unknown): MetadataValue | undefined => {
  if (value instanceof Date || value instanceof Buffer) {
    return value;
  }
  return typeof value === 'object' ? JSON.stringify(value) : undefined;
};

const parseComplexValue = (value: unknown): MetadataValue => {
  const parsers: Array<(val: unknown) => MetadataValue | undefined> = [
    parseStringValue,
    parseNullOrUndefined,
    parseObjectValue,
  ];

  for (const parser of parsers) {
    const result = parser(value);
    if (result !== undefined) {
      return result;
    }
  }

  return null; // Fallback if no parser succeeds
};

const parseMetadataValue = (value: unknown): MetadataValue => {
  return parsePrimitiveValue(value) ?? parseComplexValue(value);
};

const processMetadata = (metadata: Record<string, unknown>): Metadata => {
  const formattedMetadata = formatDateFields(metadata);
  return Object.fromEntries(
    Object.entries(formattedMetadata).map(([key, value]) => [
      key,
      parseMetadataValue(value),
    ])
  );
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const flattenObjectHelper = (
  obj: Record<string, unknown>,
  prefix: string,
  result: Record<string, unknown>
): void => {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;
    if (isObject(value)) {
      flattenObjectHelper(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
};

const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  flattenObjectHelper(obj, prefix, result);
  return result;
};

const flattenMetadata = (
  metadata: Record<string, unknown>
): Record<string, unknown> => {
  return flattenObject(metadata);
};

// Date formatting functions
const isDateField = (key: string): boolean => {
  const dateFields = new Set([
    'FileModifyDate',
    'FileAccessDate',
    'FileInodeChangeDate',
  ]);
  return dateFields.has(key);
};

const formatDateValue = (value: unknown): unknown => {
  return value instanceof Date ? value.toLocaleString() : value;
};

const formatDateFields = (
  metadata: Record<string, unknown>
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      isDateField(key) ? formatDateValue(value) : value,
    ])
  );
};

// File system functions
const getFilesInDirectory = async (
  directoryPath: string
): Promise<string[]> => {
  try {
    logger.info({ directoryPath }, 'Reading directory');
    const files = await readdir(directoryPath);
    logger.info({ fileCount: files.length, files }, 'Files found in directory');

    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.mp3', '.pdf'];
    const filteredFiles = files
      .filter((file) =>
        supportedExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      )
      .map((file) => path.join(directoryPath, file));

    logger.info(
      { filteredFileCount: filteredFiles.length, filteredFiles },
      'Filtered files'
    );
    return filteredFiles;
  } catch (error) {
    logger.error({ error, directoryPath }, 'Error in getFilesInDirectory');
    throw error;
  }
};

// PDF metadata extraction functions
const pdfMetadataGetters: Record<
  string,
  (doc: PDFDocument) => MetadataValue | null
> = {
  title: (doc) => doc.getTitle() || null,
  author: (doc) => doc.getAuthor() || null,
  subject: (doc) => doc.getSubject() || null,
  keywords: (doc) => doc.getKeywords() || null,
  producer: (doc) => doc.getProducer() || null,
  creationDate: (doc) => doc.getCreationDate() || null,
  modificationDate: (doc) => doc.getModificationDate() || null,
};

const getPdfMetadataValue = (
  pdfDoc: PDFDocument,
  key: string
): MetadataValue | null => {
  const getter = pdfMetadataGetters[key];
  return getter ? getter(pdfDoc) : null;
};

const extractPdfMetadata = (
  pdfDoc: PDFDocument
): Record<string, MetadataValue> => {
  return Object.fromEntries(
    Object.keys(pdfMetadataGetters).map((key) => [
      key,
      getPdfMetadataValue(pdfDoc, key),
    ])
  );
};

const readPdfMetadata = async (
  filePath: string
): Promise<Record<string, MetadataValue>> => {
  const fileBuffer = await readFile(filePath);
  const pdfDoc = await PDFDocument.load(fileBuffer);
  return extractPdfMetadata(pdfDoc);
};

// System information function
const getSystemInfo = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec('uname -a', (error, stdout) => {
      if (error) reject(`exec error: ${error}`);
      else resolve(stdout.trim());
    });
  });
};

// Metadata extraction functions
const extractFileMetadata = async (
  filePath: string,
  exiftool: ExifTool
): Promise<Metadata> => {
  const metadata: Record<string, unknown> = {
    basic: await exiftool.read(filePath),
    extended: await getExtendedAttributes(filePath),
    systemInfo: await getSystemInfo(),
  };

  if (filePath.endsWith('.mp3')) {
    const fileBuffer = await readFile(filePath);
    const audioMetadata = await mm.parseBuffer(fileBuffer, 'audio/mpeg');
    const id3Metadata = nodeId3.read(filePath);
    metadata.audio = {
      ...audioMetadata.format,
      ...audioMetadata.common,
      id3: id3Metadata,
    };
  } else if (filePath.endsWith('.pdf')) {
    metadata.pdf = await readPdfMetadata(filePath);
  }

  return processMetadata(flattenMetadata(metadata));
};

const processFiles = async (
  filePaths: string[],
  exiftool: ExifTool
): Promise<SourceMeta> => {
  const results: SourceMeta = [];
  await Promise.all(
    filePaths.map((filePath) =>
      extractFileMetadata(filePath, exiftool)
        .then((metadata) => {
          const projectRoot = process.cwd();
          const relativePath = filePath
            .replace(projectRoot, '')
            .replace(/^\//, '');
          results.push({
            filePath,
            relativePath,
            metadata,
          });
          logger.info(
            { relativePath, metadataKeys: Object.keys(metadata) },
            'Metadata extracted'
          );
        })
        .catch((error) => {
          logger.error({ filePath, error }, 'Metadata extraction failed');
        })
    )
  );
  return results;
};

// Main function to extract metadata from a folder
export const extractSourceMeta = async (
  folderPath: string = 'db/media'
): Promise<SourceMeta> => {
  const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });

  try {
    logger.info({ folderPath }, 'Starting metadata extraction');

    const projectRoot = process.cwd();
    logger.info({ projectRoot }, 'Project root path');

    // Fix: Use path.resolve instead of path.join to avoid path duplication
    const absoluteFolderPath = path.resolve(projectRoot, folderPath);
    logger.info({ absoluteFolderPath }, 'Absolute folder path');

    logger.info('About to call getFilesInDirectory');
    const filePaths = await getFilesInDirectory(absoluteFolderPath);
    logger.info(
      { fileCount: filePaths.length, filePaths },
      'Files found for processing'
    );

    logger.info('About to call processFiles');
    const results = await processFiles(filePaths, exiftool);
    logger.info(
      { resultCount: results.length },
      'Metadata extraction completed'
    );

    // Log the entire results object
    logger.info(
      { results: JSON.stringify(results, null, 2) },
      'Extracted metadata results'
    );

    return results;
  } catch (error) {
    logger.error({ error, folderPath }, 'Error in extractSourceMeta');
    throw error;
  } finally {
    await exiftool.end();
  }
};

async function parseAppleProvenance(
  filePath: string
): Promise<AppleProvenanceData> {
  try {
    const rawData = await fs.readFile(filePath);
    const [parsedData] = await bplist.parseFile(filePath);

    const result: AppleProvenanceData = {
      rawData: rawData.toString('base64'), // Store raw data as base64 string
      parsedData: parsedData as Record<string, unknown>,
    };

    // Extract known fields if they exist
    const knownFields = [
      'OriginatorName',
      'OriginatorIdentifier',
      'DownloadURL',
      'DownloadDate',
      'QuarantineAgentName',
      'QuarantineAgentBundleIdentifier',
      'QuarantineTimeStamp',
    ] as const;

    for (const field of knownFields) {
      if (field in parsedData && typeof parsedData[field] === 'string') {
        result[field] = parsedData[field] as string;
      }
    }

    return result;
  } catch (error) {
    // In case of error, we still need to provide the rawData
    const rawData = await fs.readFile(filePath).catch(() => Buffer.from(''));
    return {
      rawData: rawData.toString('base64'),
      error: `Parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

const getExtendedAttributes = async (
  filePath: string
): Promise<Record<string, unknown>> => {
  const attributes = await xattr.listXattr(filePath);
  const result: Record<string, unknown> = {};

  for (const attr of attributes) {
    if (attr === 'com.apple.provenance') {
      // Create a temporary file with the attribute content
      const tempFile = path.join(
        path.dirname(filePath),
        `.temp_${path.basename(filePath)}_${attr}`
      );
      try {
        const attrValue = await xattr.getXattr(filePath, attr);
        await fs.writeFile(tempFile, attrValue);
        result[attr] = await parseAppleProvenance(tempFile);
      } finally {
        // Clean up the temporary file
        await fs.unlink(tempFile).catch(() => {}); // Ignore errors if file doesn't exist
      }
    } else {
      const value = await xattr.getXattr(filePath, attr);
      result[attr] = value ? value.toString() : '';
    }
  }
  return result;
};
