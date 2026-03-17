import { useState, useEffect } from 'react';

interface NetworkStatus {
  online: boolean;
  type: string;
  effectiveType: string;
}

export function useOnlineStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    type: 'unknown',
    effectiveType: 'unknown',
  });

  useEffect(() => {
    function updateStatus() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      setStatus({
        online: navigator.onLine,
        type: connection ? connection.type : 'unknown',
        effectiveType: connection ? connection.effectiveType : 'unknown',
      });
    }

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateStatus);
    }

    updateStatus();

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      if (connection) {
        connection.removeEventListener('change', updateStatus);
      }
    };
  }, []);

  return status;
}
