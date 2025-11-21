// Chat service configuration
export const CHAT_CONFIG = {
  // n8n webhook URL - production'da environment variable'dan alınmalı
  WEBHOOK_URL: import.meta.env.VITE_N8N_WEBHOOK_URL,

  // Request timeout (milliseconds)
  TIMEOUT: 30000,

  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // Mock response settings
  ENABLE_MOCK_RESPONSES: import.meta.env.VITE_ENABLE_MOCK_RESPONSES === "true",
} as const;

export type ChatConfig = typeof CHAT_CONFIG;
