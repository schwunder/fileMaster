import { expect, describe, it } from 'vitest';

function compareColors(color1: string, color2: string) {
  const rgb1 = color1.match(/\d+/g)?.map(Number);
  const rgb2 = color2.match(/\d+/g)?.map(Number);
  return rgb1 && rgb2 && rgb1.every((val, i) => Math.abs(val - rgb2[i]) <= 1);
}

declare global {
  function applyTwindStyles(className: string): CSSStyleDeclaration;
}

describe('Tailwind CSS Setup', () => {
  it('should apply a basic Tailwind utility class', () => {
    const styles = applyTwindStyles('text-red-500');
    console.log('Basic utility class color:', styles.color);
    expect(compareColors(styles.color, 'rgb(239, 68, 68)')).toBe(true);
  });

  it('should apply a Tailwind responsive class', () => {
    const styles = applyTwindStyles('sm:text-lg');
    console.log('Responsive class font size:', styles.fontSize);
    expect(styles.fontSize).toBe('1.125rem');
  });

  it('should apply Tailwind hover state', () => {
    const styles = applyTwindStyles('hover:bg-blue-500');
    console.log('Hover state background color:', styles.backgroundColor);
    expect(compareColors(styles.backgroundColor, 'rgb(59, 130, 246)')).toBe(
      true
    );
  });

  it('should apply custom Tailwind classes', () => {
    const styles = applyTwindStyles('bg-primary text-foreground p-4');
    console.log('Custom class background color:', styles.backgroundColor);
    console.log('Custom class text color:', styles.color);
    console.log('Custom class padding:', styles.padding);
    expect(styles.backgroundColor).toBe('hsl(222.2 47.4% 11.2%)');
    expect(styles.color).toBe('hsl(210 40% 98%)');
    expect(styles.padding).toBe('1rem');
  });
});
