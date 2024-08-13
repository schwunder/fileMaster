import TSNE from 'tsne-js';

// Type definitions
type Coordinates = number[][];

interface ImageLoaderOptions {
  folderPath: string;
  imagePaths: string[];
}

interface CanvasRendererOptions {
  context: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  imageSize: number;
}

// TSNE-related functions
export const initializeTsne = (data: number[][]): number[][] => {
  const tsne = new TSNE({
    dim: 2,
    perplexity: 30,
    earlyExaggeration: 4.0,
    learningRate: 100.0,
    nIter: 1000,
    metric: 'euclidean',
  });

  tsne.init({ data });
  tsne.run();
  return tsne.getOutputScaled();
};

export const runTsneVisualization = (embeddingData: number[][]): number[][] => {
  return initializeTsne(embeddingData);
};

// Coordinate manipulation
export const normalizeCoordinates = (
  coordinates: Coordinates,
  rangeMin: number,
  rangeMax: number,
  marginPx: number,
  canvasSize: number
): Coordinates => {
  const margin = marginPx / canvasSize;
  const xValues = coordinates.map((coord) => coord[0]);
  const yValues = coordinates.map((coord) => coord[1]);

  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  return coordinates.map(([x, y]) => [
    ((x - xMin) / (xMax - xMin)) * (rangeMax - rangeMin - 2 * margin) +
      rangeMin +
      margin,
    ((y - yMin) / (yMax - yMin)) * (rangeMax - rangeMin - 2 * margin) +
      rangeMin +
      margin,
  ]);
};

// Image loading class
class ImageLoader {
  private folderPath: string;
  private imagePaths: string[];

  constructor({ folderPath, imagePaths }: ImageLoaderOptions) {
    this.folderPath = folderPath;
    this.imagePaths = imagePaths;
  }

  loadImage = async (imagePath: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `/${this.folderPath}/${imagePath}`.replace(/\/+/g, '/');
    });
  };

  getImagePaths = (): string[] => {
    return this.imagePaths;
  };
}

// Canvas rendering class
class CanvasRenderer {
  private context: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private imageSize: number;

  constructor({ context, canvas, imageSize }: CanvasRendererOptions) {
    this.context = context;
    this.canvas = canvas;
    this.imageSize = imageSize;
  }

  clear = (): void => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };

  drawImage = (img: HTMLImageElement, xPos: number, yPos: number): void => {
    this.context.drawImage(
      img,
      xPos - this.imageSize / 2,
      yPos - this.imageSize / 2,
      this.imageSize,
      this.imageSize
    );
  };

  drawPlaceholder = (xPos: number, yPos: number): void => {
    this.context.fillStyle = 'red';
    this.context.fillRect(
      xPos - this.imageSize / 2,
      yPos - this.imageSize / 2,
      this.imageSize,
      this.imageSize
    );
  };

  getPosition = (coord: number, size: number): number => {
    return Math.max(
      this.imageSize / 2,
      Math.min(coord * size, size - this.imageSize / 2)
    );
  };
}

// Main rendering function
export const renderEmbedding = async (
  context: CanvasRenderingContext2D,
  coordinates: Coordinates,
  imageSize: number,
  canvas: HTMLCanvasElement,
  imagePaths: string[],
  folderPath: string
): Promise<void> => {
  const imageLoader = new ImageLoader({ folderPath, imagePaths });
  const canvasRenderer = new CanvasRenderer({ context, canvas, imageSize });

  canvasRenderer.clear();

  const renderTasks = coordinates.map(([x, y], i) => {
    const xPos = canvasRenderer.getPosition(x, canvas.width);
    const yPos = canvasRenderer.getPosition(y, canvas.height);

    return imageLoader
      .loadImage(imagePaths[i])
      .then((img) => canvasRenderer.drawImage(img, xPos, yPos))
      .catch((error) => {
        console.error(`Failed to load image: ${imagePaths[i]}`, error);
        canvasRenderer.drawPlaceholder(xPos, yPos);
      });
  });

  await Promise.all(renderTasks);
};
