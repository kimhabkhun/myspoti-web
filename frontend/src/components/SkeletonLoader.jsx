import React from 'react';

export function SkeletonBox({ className = '', style = {} }) {
  return <div className={`skeleton-shimmer ${className}`} style={style} />;
}

export function SkeletonShortcuts({ count = 6 }) {
  return (
    <div className="home-shortcuts-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shortcut-card skeleton-item">
          <SkeletonBox style={{ width: 56, height: 56, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonBox style={{ height: 14, width: '70%', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="media-card skeleton-item">
      <SkeletonBox className="card-art-wrap" style={{ width: '100%', aspectRatio: '1', borderRadius: 8, marginBottom: 12 }} />
      <SkeletonBox style={{ height: 16, width: '85%', borderRadius: 4, marginBottom: 8 }} />
      <SkeletonBox style={{ height: 12, width: '50%', borderRadius: 4 }} />
    </div>
  );
}

export function SkeletonShelves({ shelvesCount = 2, cardsPerShelf = 4 }) {
  return (
    <div className="media-shelves">
      {Array.from({ length: shelvesCount }).map((_, sIdx) => (
        <div key={sIdx} className="shelf-section" style={{ marginBottom: 32 }}>
          <SkeletonBox style={{ height: 24, width: 200, borderRadius: 6, marginBottom: 16 }} />
          <div className="media-grid">
            {Array.from({ length: cardsPerShelf }).map((_, cIdx) => (
              <SkeletonCard key={cIdx} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonTracklist({ count = 8 }) {
  return (
    <div className="tracklist-container">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="track-row skeleton-item" style={{ cursor: 'default' }}>
          <SkeletonBox style={{ width: 20, height: 14, borderRadius: 4 }} />
          <div className="info" style={{ gap: 6 }}>
            <SkeletonBox style={{ height: 15, width: '45%', borderRadius: 4 }} />
            <SkeletonBox style={{ height: 12, width: '25%', borderRadius: 4 }} />
          </div>
          <SkeletonBox style={{ height: 13, width: '60%', borderRadius: 4 }} />
          <SkeletonBox style={{ height: 13, width: 36, borderRadius: 4, marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

