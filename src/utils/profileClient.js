export async function requestProfile(action, code, profile) {
    const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code, ...(action === 'save' ? { profile } : {}) }),
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error('기록 서버의 응답을 읽지 못했습니다.'); }
    if (!response.ok) throw new Error(result.error || '기록 서버에 연결하지 못했습니다.');
    return result;
}
