import { describe, it, expect } from 'vitest';
import { compile } from 'svelte/compiler';

describe('Svelte Setup', () => {
  it('should have access to the Svelte compiler', () => {
    expect(compile).toBeDefined();
    expect(typeof compile).toBe('function');
  });

  it('should compile a basic Svelte component', () => {
    const input = '<script>let name = "world";</script><h1>Hello {name}!</h1>';
    const { js } = compile(input, {
      filename: 'Test.svelte',
      cssHash: () => 'svelte-xyz123',
    });
    expect(js.code).toContain('export default function Test($$anchor');
    expect(js.code).toContain('Hello ${name ?? ""}!');
  });

  it('should handle Svelte directives', () => {
    const input =
      '<script>let visible = true;</script><div>{#if visible}Show me{/if}</div>';
    const { js } = compile(input, { filename: 'Test.svelte' });
    expect(js.code).toContain('$.if(node, () => visible,');
    expect(js.code).toContain('Show me');
  });

  it('should compile Svelte components with props', () => {
    const input = '<script>export let message;</script><p>{message}</p>';
    const { js } = compile(input, { filename: 'Test.svelte' });
    expect(js.code).toContain('let message = $.prop($$props, "message")');
    expect(js.code).toContain('$.set_text(text, message())');
  });

  it('should handle Svelte events', () => {
    const input =
      '<button on:click={() => console.log("clicked")}>Click me</button>';
    const { js } = compile(input, { filename: 'Test.svelte' });
    expect(js.code).toContain('$.event("click", button,');
    expect(js.code).toContain('console.log("clicked")');
  });

  it('should compile Svelte components with reactive statements', () => {
    const input =
      '<script>let count = 0; $: doubled = count * 2;</script><p>{doubled}</p>';
    const { js } = compile(input, { filename: 'Test.svelte' });
    expect(js.code).toContain('let count = 0');
    expect(js.code).toContain('$.set(doubled, count * 2)');
  });

  it('should handle Svelte slots', () => {
    const input = '<slot name="header">Default header</slot>';
    const { js } = compile(input, { filename: 'Test.svelte' });
    expect(js.code).toContain('$$props.$$slots?.["header"]');
    expect(js.code).toContain('Default header');
  });

  it('should not have access to browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });
});
