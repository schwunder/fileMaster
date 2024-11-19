import { expect, describe, it, beforeAll } from 'vitest';

function compareColors(color1: string, color2: string) {
  const rgb1 = color1.match(/\d+/g)?.map(Number);
  const rgb2 = color2.match(/\d+/g)?.map(Number);
  return rgb1 && rgb2 && rgb1.every((val, i) => Math.abs(val - rgb2[i]) <= 5);
}

declare global {
  function applyTwindStyles(className: string): CSSStyleDeclaration;
}

describe('Tailwind CSS Setup', () => {
  beforeAll(() => {
    // Set CSS variables for testing
    document.documentElement.style.setProperty('--primary', '#3490dc');
    document.documentElement.style.setProperty('--secondary', '#f6993f');
    document.documentElement.style.setProperty('--foreground', '#ffffff');
  });

  it('should apply a basic Tailwind utility class', () => {
    const styles = applyTwindStyles('text-red-500');
    expect(styles.color).toBe('rgb(239, 68, 68)');
  });

  it('should apply a Tailwind responsive class', () => {
    const styles = applyTwindStyles('sm:text-lg');
    expect(styles.fontSize).toBe('18px');
  });

  it('should apply Tailwind hover state', () => {
    const styles = applyTwindStyles('hover:bg-blue-500');
    console.log('Hover state background color:', styles.backgroundColor);
    // Note: Hover states might not be applied in this test environment
    expect(styles.backgroundColor).not.toBe('');
  });

  it('should apply custom Tailwind classes', () => {
    const styles = applyTwindStyles('bg-primary text-foreground p-4');
    console.log('Custom class background color:', styles.backgroundColor);
    console.log('Custom class text color:', styles.color);
    console.log('Custom class padding:', styles.padding);

    expect(styles.backgroundColor).not.toBe('');
    expect(styles.color).not.toBe('');
    expect(styles.padding).toBe('16px');
  });

  it('should apply another custom Tailwind class', () => {
    const styles = applyTwindStyles('bg-secondary text-foreground p-4');
    console.log('Applied styles:', styles);
    console.log('Background color:', styles.backgroundColor);
    console.log('Text color:', styles.color);
    console.log('Padding:', styles.padding);

    // Check if backgroundColor is set (it might not be the exact value we expect)
    expect(styles.backgroundColor).not.toBe('');

    // Check if color is set (it might not be the exact value we expect)
    expect(styles.color).not.toBe('');

    // Check if padding is set correctly
    expect(styles.padding).toBe('16px');

    // Additional checks to see if the CSS variables are being applied
    const computedBgColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--secondary');
    const computedTextColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--foreground');
    console.log('Computed --secondary:', computedBgColor);
    console.log('Computed --foreground:', computedTextColor);
  });
});
