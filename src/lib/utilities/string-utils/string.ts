import truncate from 'just-truncate';
import unique from 'just-unique';

export const truncateLog = (
  message: string,
  maxLength: number = 500
): string => {
  return truncate(message, maxLength, '...');
};

export const getUniqueTags = (
  metaData: { matching: string[] }[]
): [string, number][] => {
  const allTags = metaData.flatMap((meta) => meta.matching);
  const uniqueTags = unique(allTags);
  return uniqueTags.map((tag) => [
    tag,
    allTags.filter((t) => t === tag).length,
  ]);
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

export const parseDateString = (dateString: string): Date | null => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};
