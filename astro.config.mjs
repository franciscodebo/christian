// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  // Served from GitHub Pages at https://franciscodebo.github.io/christian/
  site: 'https://franciscodebo.github.io',
  base: '/christian',
  integrations: [svelte()]
});
