import React from 'react';
import '../../css/CustomModal.css';

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal-box">
        <h3 className="custom-modal-title">{title || 'Xác nhận'}</h3>
        <p className="custom-modal-message">{message}</p>
        <div className="custom-modal-actions">
          <button className="custom-btn custom-btn-cancel" onClick={onCancel}>
            Hủy
          </button>
          <button className="custom-btn custom-btn-confirm" onClick={onConfirm}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}