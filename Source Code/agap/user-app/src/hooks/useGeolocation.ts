import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  error: string | null;
  loading: boolean;
  status: 'acquiring' | 'ready' | 'failed';
}

const MANILA_COORDS = { lat: 14.5995, lng: 120.9842 };

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
    status: 'acquiring',
  });

  const capture = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, status: 'acquiring', error: null }));

    if (!navigator.geolocation) {
      setState({
        coords: MANILA_COORDS,
        error: 'Geolocation not supported / Hindi suportado ang GPS',
        loading: false,
        status: 'failed',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          loading: false,
          status: 'ready',
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location / Hindi makuha ang lokasyon';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied / Ipinagkait ang pahintulot sa lokasyon';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = 'Location unavailable / Hindi magagamit ang lokasyon';
        } else if (error.code === error.TIMEOUT) {
          errorMessage = 'Location request timed out / Nag-time out ang paghiling sa lokasyon';
        }

        setState({
          coords: MANILA_COORDS, // Fallback
          error: errorMessage,
          loading: false,
          status: 'failed',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  }, []);

  // Pre-warm on mount
  useEffect(() => {
    // Defer capture to avoid synchronous state update warning
    const timer = setTimeout(() => {
      capture();
    }, 0);
    return () => clearTimeout(timer);
  }, [capture]);

  return { ...state, capture };
}
