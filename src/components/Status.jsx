export function Loading({ what = 'Loading' }) {
  return (
    <p className="notice" role="status">
      {what}…
    </p>
  );
}

export function LoadError({ what, onRetry }) {
  return (
    <div className="notice notice-error" role="alert">
      <p>
        {what} could not be loaded. Check your internet connection and try again.
      </p>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
