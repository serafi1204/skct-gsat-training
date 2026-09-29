import React, { useState } from 'react';

export default function RecordAccess({ onOpen, busy, error }) {
    const [code, setCode] = useState('');
    return <div className="access-page">
        <form className="surface access-card" onSubmit={event => { event.preventDefault(); onOpen(code); }}>
            <div className="brand-lockup"><span className="brand-mark">S</span><span>SKCT 연습실</span></div>
            <h1>기록 코드 입력</h1>
            <p>같은 코드를 입력하면 어느 기기에서든 기록을 이어 볼 수 있습니다. 처음 쓰는 코드는 새 기록으로 시작합니다.</p>
            <label htmlFor="record-code">기록 코드</label>
            <input id="record-code" type="password" autoComplete="off" value={code}
                onChange={event => setCode(event.target.value)} maxLength={128} autoFocus />
            {error && <p className="access-error" role="alert">{error}</p>}
            <button type="submit" className="primary-button" disabled={busy}>{busy ? '불러오는 중…' : '기록 열기'}</button>
            <small>코드는 이 브라우저에 저장되지 않습니다. 다음에 다시 입력해야 합니다.</small>
        </form>
    </div>;
}
