import React, { useEffect, useRef } from 'react';
import MockExamForm from './MockExamForm.jsx';

export default function MockExamDialog({ record, onSave, onClose }) {
    const dialog = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        const element = dialog.current;
        element.showModal();
        element.querySelector('input')?.focus();
        return () => { element.close(); previous?.focus?.(); };
    }, []);
    return <dialog ref={dialog} className="mock-exam-dialog" aria-label={record ? '모의고사 기록 수정' : '새 모의고사 기록 추가'}
        onKeyDown={event => {
            if (event.key !== 'Tab') return;
            const controls = [...dialog.current.querySelectorAll('button, input, textarea, select, [tabindex="0"]')]
                .filter(element => !element.disabled);
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        onCancel={event => { event.preventDefault(); onClose(); }}>
        <button className="mock-exam-dialog-close" type="button" aria-label="입력 창 닫기" onClick={onClose}>×</button>
        <MockExamForm title={record ? '모의고사 기록 수정' : '새 모의고사 기록 추가'} record={record} onSave={onSave} onCancel={onClose} />
    </dialog>;
}
