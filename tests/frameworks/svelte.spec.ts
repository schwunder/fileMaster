// tests/frameworks/svelte.spec.ts
import { render, fireEvent } from '@testing-library/svelte';
import Counter from '../fixtures/Counter.svelte';

describe('Counter Component', () => {
  it('renders without crashing', () => {
    const { container } = render(Counter);
    expect(container).toBeTruthy();
  });

  it('contains a button', () => {
    const { getByRole } = render(Counter);
    const button = getByRole('button');
    expect(button).toBeTruthy();
  });

  it('displays the initial count', () => {
    const { getByText } = render(Counter);
    expect(getByText(/count is 0/i)).toBeTruthy();
  });

  it('increments the count when the button is clicked', async () => {
    const { getByRole, getByText } = render(Counter);
    const button = getByRole('button');

    await fireEvent.click(button);

    expect(getByText(/count is 1/i)).toBeTruthy();
  });

  it('Counter updates when buttons are clicked', async () => {
    const { getByText, getByLabelText } = render(Counter);

    // Initial state
    expect(getByText('0')).toBeTruthy();

    // Increment
    await fireEvent.click(getByLabelText('Increase the counter by one'));
    expect(getByText('1')).toBeTruthy();

    // Decrement
    await fireEvent.click(getByLabelText('Decrease the counter by one'));
    expect(getByText('0')).toBeTruthy();
  });
});
