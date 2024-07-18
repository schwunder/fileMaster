import * as tf from '@tensorflow/tfjs-node';
import '@tensorflow/tfjs-backend-webgl';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, loadImage, Image } from '@napi-rs/canvas';
import TSNE from 'tsne-js';

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 800;
const IMAGE_DIRECTORY = 'db/media';
const MAX_IMAGES = 12;

// Ensure canvas and context are properly initialized
const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const context = canvas.getContext('2d');
if (!context) {
	throw new Error('Unable to obtain 2D context');
}

// Clear the canvas
context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

/**
 * Read image files from the specified folder.
 * @param directory - The directory to read images from.
 * @param maxImages - The maximum number of images to read.
 * @returns An array of image file names.
 */
const getImageFiles = (directory: string, maxImages: number): string[] => {
	return fs.readdirSync(directory).slice(0, maxImages);
};

/**
 * Load images from the specified file names and directory.
 * @param fileNames - The names of the image files to load.
 * @param directory - The directory where the image files are located.
 * @returns A promise that resolves to an array of loaded images.
 */
const loadImages = (fileNames: string[], directory: string): Promise<Image[]> => {
	return Promise.all(
		fileNames.map((fileName) => {
			const filePath = path.join(directory, fileName);
			return loadImage(filePath);
		})
	);
};

/**
 * Convert an Image object to a Tensor.
 * @param image - The image to convert.
 * @returns A Tensor representation of the image.
 */
const imageToTensor = (image: Image): tf.Tensor => {
	const canvas = createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const imageData = ctx.getImageData(0, 0, image.width, image.height);

	const { data, width, height } = imageData;
	const uint8Array = new Uint8Array(data.buffer);
	return tf.browser
		.fromPixels({ data: uint8Array, width, height })
		.resizeBilinear([28, 28])
		.toFloat()
		.div(tf.scalar(255));
};

/**
 * Stack multiple tensors into a single tensor.
 * @param tensors - An array of tensors to stack.
 * @returns A stacked 4D tensor.
 */
const stackTensors = (tensors: tf.Tensor[]): tf.Tensor4D => {
	return tf.stack(tensors) as tf.Tensor4D;
};

/**
 * Process images from a directory and return a stacked tensor.
 * @param directory - The directory to read images from.
 * @param maxImages - The maximum number of images to process.
 * @returns A promise that resolves to a stacked 4D tensor of image data.
 */
export const processImages = async (directory: string, maxImages: number): Promise<tf.Tensor4D> => {
	const fileNames = getImageFiles(directory, maxImages);
	const images = await loadImages(fileNames, directory);
	const tensors = images.map(imageToTensor);
	return stackTensors(tensors);
};

/**
 * Initialize t-SNE embedding using tsne-js.
 * @param data - The data to embed.
 * @returns The t-SNE coordinates.
 */
export const initializeTsne = (data: number[][]): number[][] => {
	const tsne = new TSNE({
		dim: 2,
		perplexity: 30,
		earlyExaggeration: 4.0,
		learningRate: 100.0,
		nIter: 1000,
		metric: 'euclidean'
	});

	tsne.init({ data });
	tsne.run();
	return tsne.getOutputScaled();
};

/**
 * Function to start t-SNE visualization and return the coordinates.
 * @returns A promise that resolves to the t-SNE coordinates.
 */
export const runTsneVisualization = async (): Promise<number[][]> => {
	const maxImages = MAX_IMAGES;
	const directory = IMAGE_DIRECTORY;
	const imageTensors = await processImages(directory, maxImages);
	const imageData = imageTensors.arraySync();
	const flattenedData = imageData.map((img) => img.flat(2)); // Flatten the 3D array to 2D
	return initializeTsne(flattenedData);
};
