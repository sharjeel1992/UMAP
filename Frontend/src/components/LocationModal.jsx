// LocationModal — full-screen overlay shown on first load, asking the user
// whether to share their device location.
//
// If the user clicks "Use My Location", the browser's Geolocation API is
// triggered (handled in App.jsx) and the map flies to their position.
// If they click "Skip" (or click the backdrop), the modal is dismissed and
// the map stays on the default view (Seattle).
//
// Clicking the backdrop calls onSkip via the backdrop's onClick handler.
// e.stopPropagation() on the inner card prevents that from firing when the
// user interacts with the card itself.
import './LocationModal.css'

/**
 * @param {object}   props
 * @param {function} props.onUseLocation - Called when the user grants location access
 * @param {function} props.onSkip        - Called when the user dismisses the modal
 */
export default function LocationModal({ onUseLocation, onSkip }) {
  return (
    // Backdrop covers the entire viewport. Clicking outside the card skips the modal.
    <div className="modal-backdrop" onClick={onSkip} role="dialog" aria-modal="true" aria-label="Enable location">
      {/* Stop click events from bubbling to the backdrop so the card itself
          doesn't accidentally dismiss the modal on internal interactions */}
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">⊙</div>
        <h2 className="modal-title">Enable Location</h2>
        <p className="modal-body">
          UMAP uses your location to show YouTube videos near you.
          Your location is never stored or shared.
        </p>
        {/* Primary CTA — triggers the browser permission prompt */}
        <button className="modal-btn modal-btn--primary" onClick={onUseLocation}>
          ⊙ Use My Location
        </button>
        {/* Ghost CTA — skips to the default map view */}
        <button className="modal-btn modal-btn--ghost" onClick={onSkip}>
          × Skip for now
        </button>
        <p className="modal-hint">You can always search for a location manually.</p>
      </div>
    </div>
  )
}
