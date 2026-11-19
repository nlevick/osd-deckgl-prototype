import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  server: {
    fs: {
      deny: [
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc', '.yarnrc.yml', '**/.git/**', '**/web-original/**',
      ],
    },
  },
});
