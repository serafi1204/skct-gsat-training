import React, { useEffect, useRef } from 'react';

export default function ConfirmDialog({ title, description, confirmLabel, onConfirm, onCancel, destructive = false }) {
    const cancelRef = useRef(null);
    const confirmRef = useRef(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        cancelRef.current?.focus();
        const onKeyDown = event => {
            if (event.key === 'Escape') onCancel();
            if (event.key === 'Tab') {
                if (event.shiftKey && document.activeElement === cancelRef.current) {
                    event.preventDefault();
                    confirmRef.current?.focus();
                } else if (!event.shiftKey && document.activeElement === confirmRef.current) {
                    event.preventDefault();
                    cancelRef.current?.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [onCancel]);

    return <div className="dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
        <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <h2 id="confirm-title">{title}</h2>
            <p id="confirm-description">{description}</p>
            <div className="dialog-actions">
                <button type="button" ref={cancelRef} className="secondary-button" onClick={onCancel}>취소</button>
                <button type="button" ref={confirmRef} className={destructive ? 'danger-button' : 'primary-button'} onClick={onConfirm}>{confirmLabel}</button>
            </div>
        </div>
    </div>;
}
