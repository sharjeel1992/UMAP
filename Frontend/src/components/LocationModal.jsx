import './LocationModal.css'

export default function LocationModal({ onUseLocation, onSkip }) {
  return (
    <div className="modal-backdrop" onClick={onSkip} role="dialog" aria-modal="true" aria-label="Enable location">
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">⊙</div>
        <h2 className="modal-title">Enable Location</h2>
        <p className="modal-body">
          UMAP uses your location to show YouTube videos near you.
          Your location is never stored or shared.
        </p>
        <button className="modal-btn modal-btn--primary" onClick={onUseLocation}>
          ⊙ Use My Location
        </button>
        <button className="modal-btn modal-btn--ghost" onClick={onSkip}>
          × Skip for now
        </button>
        <p className="modal-hint">You can always search for a location manually.</p>
      </div>
    </div>
  )
}
