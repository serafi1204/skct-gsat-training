import { normalizeStoredProfile } from '../utils/storedProfile.js';

const encoder = new TextEncoder();

export async function profileKeyId(code) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(code));
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function handleProfileAction(body, store) {
    const code = typeof body?.code === 'string' ? body.code.trim() : '';
    if (!code || code.length > 128) return { status: 400, body: { error: '기록 코드는 1~128자로 입력해 주세요.' } };
    if (!['load', 'save'].includes(body?.action)) return { status: 400, body: { error: '알 수 없는 요청입니다.' } };

    const keyId = await profileKeyId(code);
    if (body.action === 'load') {
        const payload = await store.get(keyId);
        return { status: 200, body: { exists: payload !== null, keyId,
            profile: normalizeStoredProfile(payload === null ? null : JSON.parse(payload)) } };
    }

    if (!body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) {
        return { status: 400, body: { error: '저장할 데이터가 올바르지 않습니다.' } };
    }
    const profile = normalizeStoredProfile(body.profile);
    const payload = JSON.stringify(profile);
    if (encoder.encode(payload).length > 1_000_000) {
        return { status: 413, body: { error: '저장 데이터가 너무 큽니다.' } };
    }
    await store.put(keyId, payload);
    return { status: 200, body: { saved: true, keyId } };
}
