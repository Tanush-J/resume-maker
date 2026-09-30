const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 3 * 60 * 1000;

let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

const isEnabled = () => {
  return import.meta.env.VITE_ENABLE_SERVER_KEEP_ALIVE === 'true';
};

const getKeepAliveInterval = () => {
  const configuredInterval = Number(
    import.meta.env.VITE_SERVER_KEEP_ALIVE_INTERVAL_MS
  );

  if (!Number.isFinite(configuredInterval) || configuredInterval <= 0) {
    return DEFAULT_KEEP_ALIVE_INTERVAL_MS;
  }

  return configuredInterval;
};

const pingServer = async () => {
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn(
        '[KeepAlive] Server health check failed:',
        response.status
      );
      return;
    }

    console.debug('[KeepAlive] Server is awake.');
  } catch (error) {
    console.warn('[KeepAlive] Unable to reach server:', error);
  }
};

export const startServerKeepAlive = () => {
  if (!isEnabled()) {
    return () => {};
  }

  if (keepAliveInterval) {
    return stopServerKeepAlive;
  }

  // Wake server immediately.
  void pingServer();

  const interval = getKeepAliveInterval();

  console.debug(
    `[KeepAlive] Starting heartbeat every ${interval}ms`
  );

  keepAliveInterval = setInterval(() => {
    void pingServer();
  }, interval);

  return stopServerKeepAlive;
};

export const stopServerKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};