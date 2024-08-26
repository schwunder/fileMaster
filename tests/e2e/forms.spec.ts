import { describe, it, expect } from 'vitest';

describe('Form Submission', () => {
  it('should submit the form successfully', async () => {
    document.body.innerHTML = `
      <form>
        <input name="name" value="" />
        <input name="email" value="" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector('form')!;
    const nameInput = document.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;

    nameInput.value = 'John Doe';
    emailInput.value = 'john.doe@example.com';
    form.dispatchEvent(new Event('submit'));

    expect(document.body.textContent).toContain('Thank you, John Doe!');
  });

  it('should display validation errors', async () => {
    document.body.innerHTML = `
      <form>
        <input name="email" value="" />
        <button type="submit">Submit</button>
      </form>
    `;

    const form = document.querySelector('form')!;
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;

    emailInput.value = 'invalid-email';
    form.dispatchEvent(new Event('submit'));

    expect(document.body.textContent).toContain('Invalid email address');
  });
});
