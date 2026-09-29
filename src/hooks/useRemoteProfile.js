import { useCallback, useEffect, useRef, useState } from 'react';
import { requestProfile } from '../utils/profileClient.js';
import { normalizeStoredProfile } from '../utils/storedProfile.js';
import { clearRecordCode, loadRecordCode, saveRecordCode } from '../utils/recordCodeCookie.js';

export function useRemoteProfile() {
    const [code, setCode] = useState(null);
    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState('locked');
    const [error, setError] = useState('');
    const skipFirstSave = useRef(false);
    const saveQueue = useRef(Promise.resolve());
    const pendingSave = useRef(Promise.resolve());
    const activeCode = useRef(null);
    const saveNumber = useRef(0);
    const autoOpenStarted = useRef(false);

    useEffect(() => {
        if (!code || !profile) return;
        if (skipFirstSave.current) { skipFirstSave.current = false; return; }
        const snapshot = profile;
        const currentSave = ++saveNumber.current;
        setStatus('saving');
        const job = saveQueue.current.then(() => requestProfile('save', code, snapshot));
        pendingSave.current = job;
        saveQueue.current = job.catch(() => {});
        job.then(() => {
            if (activeCode.current === code && saveNumber.current === currentSave) setStatus('saved');
        }).catch(reason => {
            if (activeCode.current === code && saveNumber.current === currentSave) {
                setError(reason.message);
                setStatus('error');
            }
        });
    }, [code, profile]);

    const open = useCallback(async rawCode => {
        const nextCode = rawCode.trim();
        if (!nextCode) { setError('기록 코드를 입력해 주세요.'); return; }
        setStatus('loading');
        setError('');
        try {
            const loaded = await requestProfile('load', nextCode);
            const nextProfile = normalizeStoredProfile(loaded.profile);
            if (!loaded.exists) {
                await requestProfile('save', nextCode, nextProfile);
            }
            skipFirstSave.current = true;
            activeCode.current = nextCode;
            setCode(nextCode);
            setProfile(nextProfile);
            setStatus('saved');
            saveRecordCode(nextCode);
        } catch (reason) {
            setError(reason.message || '기록을 불러오지 못했습니다.');
            setStatus('locked');
        }
    }, []);

    useEffect(() => {
        if (autoOpenStarted.current) return;
        autoOpenStarted.current = true;
        const rememberedCode = loadRecordCode();
        if (rememberedCode) void open(rememberedCode);
    }, [open]);

    const updateProfile = updater => setProfile(current => current
        ? normalizeStoredProfile(typeof updater === 'function' ? updater(current) : updater)
        : current);

    const retry = () => { if (profile && code) setProfile(current => ({ ...current })); };

    const switchCode = async () => {
        try { await pendingSave.current; }
        catch { setStatus('error'); return; }
        activeCode.current = null;
        clearRecordCode();
        setCode(null);
        setProfile(null);
        setStatus('locked');
        setError('');
    };

    return { profile, status, error, open, updateProfile, retry, switchCode };
}
