import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Layout from '../../src/routes/+layout.svelte';

describe('Layout', () => {
  it('should apply the layout correctly', () => {
    const { container } = render(Layout);
    expect(container.innerHTML).toContain('<header>');
    expect(container.innerHTML).toContain('<footer>');
  });
});
