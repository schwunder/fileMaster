import { describe, it, expect } from 'vitest';
import {
  truncateLog,
  getUniqueTags,
} from '../../src/lib/utilities/string-utils/string';

describe('String Utilities', () => {
  it('should truncate a log message correctly', () => {
    const longMessage =
      'This is a very long message that needs to be truncated for logging purposes.';
    const result = truncateLog(longMessage, 20);
    expect(result).toBe('This is a very lo...');
  });

  it('should return unique tags with their count', () => {
    const metaData = [
      { matching: ['tag1', 'tag2'] },
      { matching: ['tag2', 'tag3'] },
      { matching: ['tag1', 'tag3', 'tag4'] },
    ];
    const result = getUniqueTags(metaData);
    expect(result).toEqual([
      ['tag1', 2],
      ['tag2', 2],
      ['tag3', 2],
      ['tag4', 1],
    ]);
  });
});
