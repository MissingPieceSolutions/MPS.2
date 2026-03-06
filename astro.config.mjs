import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com', // Placeholder — updated in 03-02 when domain is decided
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
