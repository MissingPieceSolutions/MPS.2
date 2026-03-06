// Formspree endpoint: https://formspree.io/f/xeerqepo
// Used in: src/pages/contact form (Phase 5)

import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mps-2.pages.dev', // Update to custom domain when registered
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
