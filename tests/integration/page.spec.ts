import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Page from '../../src/routes/+page.svelte';

describe('Page', () => {
  it('should render the home page correctly', () => {
    const { container } = render(Page);
    expect(container.innerHTML).toContain('<h1>Home</h1>');
  });
});
