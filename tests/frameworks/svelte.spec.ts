import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte/svelte5';
import Counter from './Counter.svelte';
import '@testing-library/jest-dom';

describe('CounterComponent Svelte Tests', () => {
  it('should render the component with initial count', () => {
    const { getByText } = render(Counter, { props: { count: 0 } });

    const button = getByText('Clicked 0 times');
    expect(button).not.toBeNull();
    expect(button).toBeVisible();
  });

  it('should update the count when button is clicked', async () => {
    const { getByText } = render(Counter, { props: { count: 0 } });

    const button = getByText('Clicked 0 times');
    await fireEvent.click(button);

    expect(button.textContent).toBe('Clicked 1 time');
  });

  it('should correctly update count on multiple clicks', async () => {
    const { getByText } = render(Counter, { props: { count: 0 } });

    const button = getByText('Clicked 0 times');
    await fireEvent.click(button);
    await fireEvent.click(button);

    expect(button.textContent).toBe('Clicked 2 times');
  });
});
