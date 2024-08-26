import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { Button } from '$components/ui/button';
import '@testing-library/jest-dom';

describe('ShadCN Button Integration', () => {
  it('should render the ShadCN Button correctly', () => {
    const { container } = render(Button, {
      props: { variant: 'default' },
    });
    expect(container.innerHTML).toContain(
      '<button>ShadCN Test Button</button>'
    );
  });

  it('should apply ShadCN button styles correctly', () => {
    const { container } = render(Button, {
      props: { variant: 'default' },
    });
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    expect(button!.classList.contains('shadcn-button')).toBe(true);
  });
});
