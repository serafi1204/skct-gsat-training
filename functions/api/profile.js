import { handleProfileAction } from '../../src/server/profileApi.js';

export async function onRequestPost({ request, env }) {
    if (!env.DB) return Response.json({ error: 'D1 데이터베이스가 연결되지 않았습니다.' }, { status: 503 });
    try {
        const body = await request.json();
        const store = {
            get: async keyId => {
                const row = await env.DB.prepare('SELECT payload FROM profiles WHERE key_id = ?1').bind(keyId).first();
                return row?.payload ?? null;
            },
            put: async (keyId, payload) => {
                await env.DB.prepare(`INSERT INTO profiles (key_id, payload, updated_at)
                    VALUES (?1, ?2, datetime('now'))
                    ON CONFLICT(key_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`)
                    .bind(keyId, payload).run();
            },
        };
        const result = await handleProfileAction(body, store);
        return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store' } });
    } catch {
        return Response.json({ error: '기록을 처리하지 못했습니다. 데이터베이스 설정을 확인해 주세요.' }, { status: 500 });
    }
}
