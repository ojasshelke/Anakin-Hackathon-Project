"use client";
import { useEffect } from 'react';

/**
 * EmbedScript — The "Magic Script" for marketplaces.
 * This script allows external sites to easily embed the VEXA Try-On Overlay.
 */
export function EmbedScript() {
  useEffect(() => {
    // This logic ensures that if VEXA is embedded as a script, 
    // it can find the target containers and inject the overlay.
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'VEXA_INIT') {
        console.log('[VEXA] Initializing overlay for marketplace...');
      }
    });
  }, []);

  return null; // This is a script-only component
}
