import TSNE from 'tsne-js';

// Define the type for the coordinates
type Coordinates = number[][];

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

export function normalizeCoordinates(
  coordinates: Coordinates,
  rangeMin: number,
  rangeMax: number,
  marginPx: number,
  canvasSize: number
): Coordinates {
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
}

export async function renderEmbedding(
  context: CanvasRenderingContext2D,
  coordinates: Coordinates,
  imageSize: number,
  canvas: HTMLCanvasElement,
  imagePaths: string[],
  folderPath: string
): Promise<void> {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  for (let i = 0; i < coordinates.length; i++) {
    const [x, y] = coordinates[i];
    const xPos = Math.max(
      imageSize / 2,
      Math.min(x * canvas.width, canvas.width - imageSize / 2)
    );
    const yPos = Math.max(
      imageSize / 2,
      Math.min(y * canvas.height, canvas.height - imageSize / 2)
    );

    try {
      const fullPath = `/${folderPath}/${imagePaths[i]}`.replace(/\/+/g, '/');
      const img = await loadImage(fullPath);
      context.drawImage(
        img,
        xPos - imageSize / 2,
        yPos - imageSize / 2,
        imageSize,
        imageSize
      );
    } catch (error) {
      console.error(`Failed to load image: ${imagePaths[i]}`, error);
      context.fillStyle = 'red';
      context.fillRect(
        xPos - imageSize / 2,
        yPos - imageSize / 2,
        imageSize,
        imageSize
      );
    }
  }
}
