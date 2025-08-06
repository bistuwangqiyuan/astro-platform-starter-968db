import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    adapter: netlify({
        edgeMiddleware: true
    }),
    integrations: [
        react()
    ],
    // 设置为你的实际域名，或者留空使用 Netlify 默认域名
    site: process.env.PUBLIC_APP_URL || 'https://your-site.netlify.app',
    base: '/',
    trailingSlash: 'ignore',
    build: {
        format: 'directory'
    }
});
