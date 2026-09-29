const cookieName = 'skctRecordCode';
const maxAge = 60 * 60 * 24 * 30;

export function loadRecordCode(cookieStore = document) {
    try {
        const entry = cookieStore.cookie.split(';').map(part => part.trim())
            .find(part => part.startsWith(`${cookieName}=`));
        const code = entry ? decodeURIComponent(entry.slice(cookieName.length + 1)).trim() : '';
        return code.length <= 128 ? code : '';
    } catch { return ''; }
}

export function saveRecordCode(code, cookieStore = document, protocol = location.protocol) {
    try {
        cookieStore.cookie = `${cookieName}=${encodeURIComponent(code)}; Path=/; SameSite=Lax; Max-Age=${maxAge}${protocol === 'https:' ? '; Secure' : ''}`;
    } catch { /* Cookie restrictions must not prevent opening server records. */ }
}

export function clearRecordCode(cookieStore = document, protocol = location.protocol) {
    try {
        cookieStore.cookie = `${cookieName}=; Path=/; SameSite=Lax; Max-Age=0${protocol === 'https:' ? '; Secure' : ''}`;
    } catch { /* Keep manual access available when cookies are disabled. */ }
}
