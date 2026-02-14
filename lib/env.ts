/**
 * Environment variables validation and configuration
 * Ensures all required environment variables are set at build time
 */

function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue || "";
}

export const env = {
  // Node environment
  nodeEnv: process.env.NODE_ENV as "development" | "production" | "test",
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // App configuration
  appName: process.env.NEXT_PUBLIC_APP_NAME || "CLAWDIS",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0-beta1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Gateway configuration
  gatewayBaseUrl: getEnvVariable("NEXT_PUBLIC_GATEWAY_BASE_URL", "http://localhost:3001"),
  gatewayWebSocketUrl: getEnvVariable("NEXT_PUBLIC_GATEWAY_WS_URL", "ws://localhost:3001"),

  // Twilio (optional - for WhatsApp integration)
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsAppFrom: process.env.TWILIO_WHATSAPP_FROM,

  // Telegram (optional - for Telegram integration)
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,

  // Analytics & Monitoring (optional)
  vercelAnalyticsId: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

/**
 * Validate required environment variables on app start
 */
export function validateEnv(): void {
  const requiredEnvs = [
    "NEXT_PUBLIC_GATEWAY_BASE_URL",
    "NEXT_PUBLIC_GATEWAY_WS_URL",
  ];

  const missing = requiredEnvs.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[v0] Missing required environment variables: ${missing.join(", ")}`
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }
}
