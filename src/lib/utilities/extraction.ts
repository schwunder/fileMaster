import { ExifTool } from 'exiftool-vendored';
import { join, resolve } from 'path';
import { readdir, readFile as fsReadFile } from 'fs/promises';
import { exec } from 'child_process';
import * as mm from 'music-metadata';
import nodeId3 from 'node-id3';
import { PDFDocument } from 'pdf-lib';
import * as xattr from 'node-xattr';
import pino from 'pino';

const logger = pino();

export type MetadataValue = string | number | Date | boolean | null | Buffer;
export type Metadata = Record<string, MetadataValue>;
export type SourceMeta = Array<{ filePath: string; metadata: Metadata }>;

export async function listFilesImages(
  directoryPath: string
): Promise<string[]> {
  const files = await readdir(directoryPath);
  return files
    .filter((file) =>
      ['.png', '.jpg', '.mp3', '.pdf'].some((ext) => file.endsWith(ext))
    )
    .map((file) => join(directoryPath, file));
}

function formatMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const formattedMetadata: Record<string, unknown> = { ...metadata };
  const dateFields = [
    'FileModifyDate',
    'FileAccessDate',
    'FileInodeChangeDate',
  ];

  dateFields.forEach((field) => {
    const value = metadata[field];
    if (value instanceof Date) {
      formattedMetadata[field] = value.toLocaleString();
    } else if (value && typeof value === 'object' && 'toISOString' in value) {
      formattedMetadata[field] = new Date(
        (value as { toISOString: () => string }).toISOString()
      ).toLocaleString();
    }
  });

  return formattedMetadata;
}

async function getExtendedAttributes(
  filePath: string
): Promise<Record<string, string>> {
  const attributes = await xattr.listXattr(filePath);
  const result: Record<string, string> = {};
  for (const attr of attributes) {
    const value = await xattr.getXattr(filePath, attr);
    result[attr] = value ? value.toString() : '';
  }
  return result;
}

async function readPdfMetadata(
  filePath: string
): Promise<Record<string, MetadataValue>> {
  const fileBuffer = await fsReadFile(filePath);
  const pdfDoc = await PDFDocument.load(fileBuffer);
  return {
    title: pdfDoc.getTitle() || null,
    author: pdfDoc.getAuthor() || null,
    subject: pdfDoc.getSubject() || null,
    keywords: pdfDoc.getKeywords() || null,
    producer: pdfDoc.getProducer() || null,
    creationDate: pdfDoc.getCreationDate() || null,
    modificationDate: pdfDoc.getModificationDate() || null,
  };
}

async function getSystemInfo(): Promise<string> {
  return new Promise((resolve, reject) => {
    exec('uname -a', (error, stdout) => {
      if (error) {
        reject(`exec error: ${error}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function parseMetadataValue(value: unknown): MetadataValue {
  if (value instanceof Date || value instanceof Buffer) {
    return value;
  }
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return null;
  }
  return JSON.stringify(value);
}

function processMetadata(metadata: Record<string, unknown>): Metadata {
  return Object.entries(metadata).reduce((acc, [key, value]) => {
    acc[key] = parseMetadataValue(value);
    return acc;
  }, {} as Metadata);
}

export async function extractSourceMeta(
  folderPath: string
): Promise<SourceMeta> {
  const absoluteFolderPath = resolve(folderPath);
  const results: SourceMeta = [];
  const exiftool = new ExifTool({ taskTimeoutMillis: 5000 });
  try {
    logger.info({ absoluteFolderPath }, 'Starting to extract source metadata');
    const filePaths = await listFilesImages(absoluteFolderPath);
    logger.info({ fileCount: filePaths.length }, 'Found files to process');

    for (const filePath of filePaths) {
      logger.info({ filePath }, 'Processing file');
      const metadata: Record<string, unknown> = {};

      try {
        metadata.basic = await exiftool.read(filePath);
        metadata.extended = await getExtendedAttributes(filePath);

        if (filePath.endsWith('.mp3')) {
          const fileBuffer = await fsReadFile(filePath);
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

        // Simplify and process the metadata structure
        const simplifiedMetadata = Object.entries(metadata).reduce(
          (acc: Record<string, unknown>, [key, value]) => {
            if (typeof value === 'object' && value !== null) {
              acc[key] = Object.entries(
                value as Record<string, unknown>
              ).reduce(
                (subAcc: Record<string, unknown>, [subKey, subValue]) => {
                  subAcc[subKey] = subValue;
                  return subAcc;
                },
                {}
              );
            } else {
              acc[key] = value;
            }
            return acc;
          },
          {}
        );

        logger.info(
          { filePath, metadataKeys: Object.keys(simplifiedMetadata) },
          'Extracted metadata'
        );
        results.push({
          filePath,
          metadata: processMetadata(
            formatMetadata(simplifiedMetadata) as Record<string, unknown>
          ),
        });
      } catch (error) {
        logger.error({ filePath, error }, 'Error reading metadata for file');
      }
    }

    const systemInfo = await getSystemInfo();
    logger.info({ systemInfo }, 'System Info');
  } catch (error) {
    logger.error({ error }, 'Unable to scan directory');
  } finally {
    await exiftool.end();
  }

  logger.info(
    { resultCount: results.length },
    'Finished extracting source metadata'
  );
  return results;
}
