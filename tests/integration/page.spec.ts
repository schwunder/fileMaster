import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from '../../src/routes/+page.svelte';
import { tick } from 'svelte';

describe('Page', () => {
  beforeEach(async () => {
    const { container } = render(Page);
    await tick();
    console.log('Initial render complete');
    console.log('Container content:', container.innerHTML);
    console.log('Body content:', document.body.innerHTML);
  });

  it('should render without crashing', () => {
    const bodyContent = document.body.innerHTML;
    console.log('Body content in first test:', bodyContent);
    expect(bodyContent).not.toBe('');
  });

  it('should display the welcome heading', async () => {
    const headings = screen.queryAllByRole('heading');
    console.log(
      'Found headings:',
      headings.map((h) => h.textContent)
    );
    expect(headings.length).toBeGreaterThan(0);
  });

  it('should have a file upload button', () => {
    const button = screen.queryByRole('button', { name: /process/i });
    console.log('Found button:', button?.textContent);
    expect(button).toBeTruthy();
  });

  it('should have a form to add a folder', () => {
    const folderInput = screen.queryByLabelText(/folder path/i);
    console.log('Found folder input:', folderInput);
    expect(folderInput).toBeTruthy();
  });

  it('should display category toggle buttons', () => {
    const tagSelector = screen.queryByRole('group');
    console.log('Found tag selector:', tagSelector);
    expect(tagSelector).toBeTruthy();
  });

  it('should have a footer', () => {
    const footer = screen.queryByRole('contentinfo');
    console.log('Found footer:', footer);
    expect(footer).toBeTruthy();
  });
});
