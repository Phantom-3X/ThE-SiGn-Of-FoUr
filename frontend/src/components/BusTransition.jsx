import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BusTransition — shows a green bus driving across the center
 * for ~2s on page change, then disappears and reveals the page.
 */
const BusTransition = ({ children, locationKey }) => {
  const [showBus, setShowBus] = useState(true);

  useEffect(() => {
    setShowBus(true);
    const timer = setTimeout(() => setShowBus(false), 2200);
    return () => clearTimeout(timer);
  }, [locationKey]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Bus overlay — visible for ~2s then vanishes */}
      <AnimatePresence>
        {showBus && (
          <motion.div
            key="bus-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            {/* Bus — drives from 20% to 80% of the screen */}
            <motion.div
              initial={{ x: '-30vw' }}
              animate={{ x: '30vw' }}
              transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <svg width="130" height="52" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="74" rx="80" ry="4" fill="rgba(0,0,0,0.06)" />
                <rect x="10" y="14" width="170" height="48" rx="10" fill="#10b981" />
                <rect x="10" y="38" width="170" height="7" fill="#ffffff" opacity="0.85" />
                <rect x="30" y="8" width="120" height="8" rx="4" fill="#059669" />
                {[24, 46, 68, 90, 112, 134].map((wx, i) => (
                  <rect key={i} x={wx} y="19" width="16" height="14" rx="3" fill="#d1fae5" stroke="#059669" strokeWidth="1" />
                ))}
                <rect x="158" y="17" width="18" height="30" rx="4" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
                <rect x="152" y="46" width="14" height="14" rx="2" fill="#ffffff" stroke="#059669" strokeWidth="1" />
                <rect x="178" y="26" width="5" height="5" rx="2" fill="#fbbf24" />
                <rect x="178" y="48" width="6" height="10" rx="2" fill="#059669" />
                <rect x="10" y="48" width="5" height="8" rx="2" fill="#ef4444" opacity="0.7" />
                <circle cx="50" cy="65" r="10" fill="#334155" />
                <circle cx="50" cy="65" r="4.5" fill="#94a3b8" />
                <circle cx="155" cy="65" r="10" fill="#334155" />
                <circle cx="155" cy="65" r="4.5" fill="#94a3b8" />
              </svg>
            </motion.div>

            {/* Loading label */}
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: '#10b981',
              }}
            >
              Loading...
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content — always rendered, fades in */}
      <motion.div
        key={`page-${locationKey}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: showBus ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ height: '100%', width: '100%' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default BusTransition;
