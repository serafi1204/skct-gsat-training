import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile } from 'node:fs/promises';
import { handleProfileAction } from './src/server/profileApi.js';

function localProfileApi() {
  return {
    name: 'local-profile-api',
    async configureServer(server) {
      const file = new URL('./.local-profile-data.json', import.meta.url);
      let records = {};
      try { records = JSON.parse(await readFile(file, 'utf8')); }
      catch { /* A new local server starts with an empty data file. */ }
      let writes = Promise.resolve();
      server.middlewares.use('/api/profile', async (request, response) => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'POST 요청만 지원합니다.' }));
          return;
        }
        try {
          const chunks = [];
          for await (const chunk of request) chunks.push(chunk);
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const result = await handleProfileAction(body, {
            get: async keyId => records[keyId] ?? null,
            put: async (keyId, payload) => {
              records[keyId] = payload;
              writes = writes.catch(() => {}).then(() => writeFile(file, JSON.stringify(records)));
              await writes;
            },
          });
          response.statusCode = result.status;
          response.end(JSON.stringify(result.body));
        } catch {
          response.statusCode = 500;
          response.end(JSON.stringify({ error: '로컬 기록을 처리하지 못했습니다.' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localProfileApi()],
});
