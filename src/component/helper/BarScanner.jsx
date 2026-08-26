'use client'
import { useEffect, useRef } from 'react'

const BarScanner = ({ onScan }) => {
  const buffer = useRef('')
  const lastKeyTime = useRef(Date.now())

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isUserBusy = 
        activeEl && (
          activeEl.tagName === 'INPUT' || 
          activeEl.tagName === 'TEXTAREA' || 
          activeEl.tagName === 'SELECT' || 
          activeEl.closest('.dropdown-content') || 
          activeEl.isContentEditable
        );

      // If the user is currently typing in an input/textarea/select,
      // let the browser handle it normally unless it's the barcode field itself.
      if (isUserBusy) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (buffer.current.length > 2) {
          onScan(buffer.current);
        }
        buffer.current = ''; 
      } else if (e.key.length === 1) {
        // Barcode scanners input characters very rapidly (< 50ms between keystrokes).
        // If the gap is longer, treat it as the start of a new scan or manual typing.
        if (timeDiff > 50) {
          buffer.current = e.key;
        } else {
          buffer.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onScan]);

  return null;
}

export default BarScanner;
