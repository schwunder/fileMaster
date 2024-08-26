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
import clone from 'just-clone';
import unique from 'just-unique';
import groupBy from 'just-group-by';
//import filterObject from 'just-filter-object';
import mapObject from 'just-map-object';
import pick from 'just-pick';
//import compact from 'just-compact';
import last from 'just-last';
import extend from 'just-extend';
//import omit from 'just-omit';
//import isEmpty from 'just-is-empty';
import isPrimitive from 'just-is-primitive';
import { parseDateString } from '../string-utils/string';

// TODO extract data directly from the order to import or even better right from the macos photos app
// move type definitions to their own file
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
const parseMetadataValue = (value: unknown): MetadataValue => {
  if (isPrimitive(value)) {
    return value as MetadataValue;
  }
  if (typeof value === 'string') {
    return parseDateString(value);
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date || value instanceof Buffer) {
    return value;
  }
  return JSON.stringify(value);
};

const processMetadata = (metadata: Record<string, unknown>): Metadata => {
  const formattedMetadata = formatDateFields(clone(metadata));
  return mapObject(formattedMetadata, (_, value) => parseMetadataValue(value));
};

const flattenObject = (
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(
          acc,
          flattenObject(value as Record<string, unknown>, newKey)
        );
      } else {
        acc[newKey] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
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
  return mapObject(metadata, (key, value) => ({
    [key]: isDateField(key) ? formatDateValue(value) : value,
  }));
};

// File system functions
const SUPPORTED_EXTENSIONS = unique([
  '.png',
  '.jpg',
  '.jpeg',
  '.mp3',
  '.pdf',
  '.avif',
  '.heic',
]);

const isSupportedFile = (fileName: string): boolean =>
  SUPPORTED_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));

const getFullPath =
  (directoryPath: string) =>
  (fileName: string): string =>
    path.join(directoryPath, fileName);

const filterAndMapFiles =
  (directoryPath: string) =>
  (files: string[]): string[] => {
    const filteredFiles = files
      .filter(isSupportedFile)
      .map(getFullPath(directoryPath));
    logger.info(
      { filteredFileCount: filteredFiles.length, filteredFiles },
      'Filtered files'
    );
    return filteredFiles;
  };

const readDirectoryContents = async (
  directoryPath: string
): Promise<string[]> => {
  logger.info({ directoryPath }, 'Reading directory');
  const files = await readdir(directoryPath);
  logger.info({ fileCount: files.length, files }, 'Files found in directory');
  return files;
};

const groupFilesByBaseName = (files: string[]): Record<string, string[]> => {
  return groupBy(files, (file) => path.parse(file).name);
};

const selectFileFromGroup = async (group: string[]): Promise<string> => {
  if (group.length === 1) return group[0];

  const preferredFile = group.find(
    (file) =>
      !file.toLowerCase().endsWith('.avif') &&
      !file.toLowerCase().endsWith('.heic')
  );
  if (preferredFile) return preferredFile;

  const fileStats = await Promise.all(
    group.map(async (file) => ({
      file,
      stat: await fs.stat(file),
    }))
  );

  return last(fileStats.sort((a, b) => a.stat.birthtimeMs - b.stat.birthtimeMs))
    .file;
};

const getFilesInDirectory = async (
  directoryPath: string
): Promise<string[]> => {
  try {
    const files = await readDirectoryContents(directoryPath);
    const filteredFiles = filterAndMapFiles(directoryPath)(files);
    const groupedFiles = groupFilesByBaseName(filteredFiles);

    const selectedFiles = await Promise.all(
      Object.values(groupedFiles).map(selectFileFromGroup)
    );

    logger.info(
      { selectedFileCount: selectedFiles.length, selectedFiles },
      'Selected files'
    );

    return selectedFiles;
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

const extractPdfMetadata = (
  pdfDoc: PDFDocument
): Record<string, MetadataValue> => {
  const allMetadata = mapObject(pdfMetadataGetters, (key, getter) =>
    getter(pdfDoc)
  );
  return Object.fromEntries(
    Object.entries(allMetadata).filter(([_, value]) => value !== null)
  ) as Record<string, MetadataValue>;
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

  const fileExtension = path.extname(filePath).toLowerCase();
  if (fileExtension === '.mp3') {
    const fileBuffer = await readFile(filePath);
    const audioMetadata = await mm.parseBuffer(fileBuffer, 'audio/mpeg');
    const id3Metadata = nodeId3.read(filePath);
    metadata.audio = extend({}, audioMetadata.format, audioMetadata.common, {
      id3: id3Metadata,
    });
  } else if (fileExtension === '.pdf') {
    metadata.pdf = await readPdfMetadata(filePath);
  } else if (fileExtension === '.avif' || fileExtension === '.heic') {
    logger.info({ filePath }, 'Extracted metadata for AVIF/HEIC file');
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

interface ParsedProvenanceData {
  [key: string]: unknown;
}

//TODO should be typed in index.ts
const knownFields = [
  'OriginatorName',
  'OriginatorIdentifier',
  'DownloadURL',
  'DownloadDate',
  'QuarantineAgentName',
  'QuarantineAgentBundleIdentifier',
  'QuarantineTimeStamp',
] as const;

async function readRawData(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath).catch((error) => {
    logger.warn(
      { error, filePath },
      'Failed to read file, returning empty buffer'
    );
    return Buffer.from('');
  });
}

const parseKnownFields = (
  parsedData: ParsedProvenanceData
): Partial<AppleProvenanceData> => {
  return pick(parsedData, ...knownFields) as Partial<AppleProvenanceData>;
};

async function parseBinaryPlist(
  filePath: string
): Promise<ParsedProvenanceData> {
  return bplist
    .parseFile(filePath)
    .then(([parsedData]) => parsedData as ParsedProvenanceData)
    .catch((error) => {
      logger.error({ error, filePath }, 'Failed to parse binary plist');
      throw error;
    });
}

const parseAppleProvenance = async (
  filePath: string
): Promise<AppleProvenanceData> => {
  const rawData = await readRawData(filePath);

  return parseBinaryPlist(filePath)
    .then((parsedData) => {
      const knownFieldsData = parseKnownFields(parsedData);
      return {
        rawData: rawData.toString('base64'),
        parsedData,
        ...knownFieldsData,
      };
    })
    .catch((error) => ({
      rawData: rawData.toString('base64'),
      error: `Parsing failed: ${error instanceof Error ? error.message : String(error)}`,
    }));
};

const createTempFile = async (
  filePath: string,
  attr: string
): Promise<string> => {
  const tempFile = path.join(
    path.dirname(filePath),
    `.temp_${path.basename(filePath)}_${attr}`
  );
  const attrValue = await xattr.getXattr(filePath, attr);
  await fs.writeFile(tempFile, attrValue);
  return tempFile;
};

const cleanupTempFile = async (tempFile: string): Promise<void> => {
  return fs.unlink(tempFile).catch((error) => {
    logger.warn({ error, tempFile }, 'Failed to delete temporary file');
  });
};

const handleAppleProvenance = async (
  filePath: string,
  attr: string
): Promise<unknown> => {
  const tempFile = await createTempFile(filePath, attr);
  try {
    return await parseAppleProvenance(tempFile);
  } finally {
    await cleanupTempFile(tempFile);
  }
};

const handleRegularAttribute = async (
  filePath: string,
  attr: string
): Promise<string> => {
  const value = await xattr.getXattr(filePath, attr);
  return value ? value.toString() : '';
};

const getExtendedAttributes = async (
  filePath: string
): Promise<Record<string, unknown>> => {
  const attributes = await xattr.listXattr(filePath);
  const result = await Promise.all(
    attributes.map(async (attr) => [
      attr,
      attr === 'com.apple.provenance'
        ? await handleAppleProvenance(filePath, attr)
        : await handleRegularAttribute(filePath, attr),
    ])
  );
  return Object.fromEntries(result);
};
