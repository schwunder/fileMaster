export const truncateLog = (
  message: string,
  maxLength: number = 500
): string => {
  return message.length > maxLength
    ? message.substring(0, maxLength) + '...'
    : message;
};

export const getUniqueTags = (
  metaData: { matching: string[] }[]
): [string, number][] => {
  const tagCounts: Record<string, number> = {};
  metaData.forEach((meta) => {
    meta.matching.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
};

export const getImageUrl = (relativePath: string): string => {
  return `/${relativePath}`;
};

export const parseJSON = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    console.warn(`Failed to parse JSON: ${value}`);
    return null;
  }
};
