import "./ConfirmDialog.css";

export default function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="cd-title">{title}</h3>
        <p className="cd-message">{message}</p>
        <div className="cd-actions">
          <button className="btn-cd-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-cd-confirm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
