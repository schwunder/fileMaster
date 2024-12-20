import { OPENAI_API_KEY } from '$env/static/private';
import OpenAI from 'openai';
import axios from 'axios';
import { z } from 'zod';
import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import sharp from 'sharp';
import convertHeic from 'heic-convert';
import path from 'path';
import fs from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import type { imageMeta } from '$lib/schemas';
import safeGet from 'just-safe-get';
import safeSet from 'just-safe-set';
import isEmpty from 'just-is-empty';

export const maxDescriptionLength = 50;
export const maxTextToEmbedLength = 5000;
export const maxImageSizeMB = 20;

let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'The OPENAI_API_KEY environment variable is missing or empty.'
      );
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

export const fetchEmbedding = async (text: string): Promise<number[]> => {
  try {
    const openaiClient = getOpenAIClient();
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
      encoding_format: 'float',
    });

    if (
      response &&
      response.data &&
      response.data[0] &&
      response.data[0].embedding
    ) {
      return response.data[0].embedding;
    } else {
      throw new Error('Invalid response structure');
    }
  } catch (error) {
    throw new Error(`Error fetching embedding for text: ${text}`, {
      cause: error,
    });
  }
};

export const getImageDescription = async (
  base64Img: string,
  prompt: string
): Promise<string> => {
  const requestBody = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Img}` },
          },
        ],
      },
    ],
    max_tokens: maxDescriptionLength,
  };

  try {
    const res = await axios.post<{
      choices: { message: { content: string } }[];
    }>('https://api.openai.com/v1/chat/completions', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    return res.data.choices[0].message.content;
  } catch (error) {
    const errorMessage =
      axios.isAxiosError(error) && error.response
        ? `Error sending request to OpenAI: ${error.response.data}`
        : `Error sending request to OpenAI: ${(error as Error).message}`;
    throw new Error(errorMessage);
  }
};

const getMetadata = async (
  comment: string,
  sampleTags: string[]
): Promise<{
  tags: string[];
  title: string;
  description: string;
  matching: string[];
}> => {
  try {
    const sampleList = sampleTags.join(', ');
    const { object } = (await generateObject({
      schema: z.object({
        tags: z.array(z.string()),
        title: z.string(),
        description: z.string(),
        matching: z.array(z.string()),
      }),
      model: createOpenAI({ apiKey: OPENAI_API_KEY })('gpt-4o'),
      prompt: `${comment}---- 
        1. Provide a description and use under ${maxDescriptionLength} tokens.
        2. Generate 1-4 descriptive tags that are relevant to the description. Do not consider the following list of sample tags while generating these tags: ${sampleList}.
        3. After generating the description and tags, choose 1-4 matching tags from the following list:  ${sampleList}. Ensure that the matching tags and the generated tags are completely different and do not overlap.`,
    })) as {
      object: {
        description: string;
        matching: string[];
        tags: string[];
        title: string;
      };
    };
    return object;
  } catch (error) {
    throw new Error(`Error getting metadata: ${(error as Error).message}`);
  }
};

export async function getBase64Image(imgPath: string): Promise<string> {
  const absPath = path.join(process.cwd(), imgPath);

  try {
    let imgBuffer = await fs.readFile(absPath);
    const fileType = await fileTypeFromBuffer(imgBuffer);
    const mimeType = fileType ? fileType.mime : undefined;

    let imgSizeMB = imgBuffer.byteLength / (1024 * 1024);

    // Convert HEIF to JPEG if necessary
    if (
      imgPath.endsWith('.heic') ||
      imgPath.endsWith('.heif') ||
      mimeType === 'image/heif' ||
      mimeType === 'image/heic'
    ) {
      try {
        const convertedBuffer = await convertHeic({
          buffer: imgBuffer,
          format: 'JPEG',
          quality: 1,
        });
        imgBuffer = Buffer.from(convertedBuffer);
      } catch (conversionError) {
        throw new Error('Error converting HEIF to JPEG: ' + conversionError);
      }
    }

    // Re-encode the image to strip metadata
    try {
      const jpegBuffer = await sharp(Buffer.from(imgBuffer))
        .jpeg({ quality: 80 })
        .toBuffer();

      imgBuffer = jpegBuffer;
      imgSizeMB = imgBuffer.byteLength / (1024 * 1024);
    } catch (sharpError) {
      throw new Error('Error processing image with sharp: ' + sharpError);
    }

    // Check image size
    if (imgSizeMB > maxImageSizeMB) {
      throw new Error(
        `Image size (${imgSizeMB.toFixed(
          2
        )}MB) exceeds the maximum allowed size (${maxImageSizeMB}MB).`
      );
    }

    return imgBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Error getting base64 image: ${(error as Error).message}`);
  }
}

export async function processImage(
  imgPath: string,
  sampleTags: string[]
): Promise<imageMeta> {
  try {
    const base64Img = await getBase64Image(imgPath);

    const imgDescription = await getImageDescription(
      base64Img,
      `What's in this image? Be concise and use under ${maxTextToEmbedLength} tokens`
    );
    const embedding = await fetchEmbedding(imgDescription);
    const { tags, title, description, matching } = await getMetadata(
      imgDescription,
      sampleTags
    );

    // Create the convertedPath by changing the extension to .avif
    const convertedPath = path.join(
      path.dirname(imgPath),
      path.basename(imgPath, path.extname(imgPath)) + '.avif'
    );

    const imageMeta: imageMeta = {
      originalPath: imgPath,
      convertedPath: convertedPath,
      tags,
      matching,
      title,
      description,
      embedding,
      type: 'image',
      processed: 1,
    };

    return imageMeta;
  } catch (error) {
    throw new Error(`Error processing image: ${(error as Error).message}`);
  }
}

export async function processImages(
  filePaths: string[],
  sampleTags: string[]
): Promise<imageMeta[]> {
  const imageDetails: imageMeta[] = [];
  for (const filePath of filePaths) {
    try {
      const imageData = await processImage(filePath, sampleTags);
      if (!isEmpty(imageData)) {
        imageDetails.push(imageData);
      }
    } catch (error) {
      console.error(
        `Error processing image ${filePath}: ${(error as Error).message}`
      );
    }
  }

  return imageDetails;
}
