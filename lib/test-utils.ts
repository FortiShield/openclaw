import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { GatewayProvider } from "@/components/gateway-provider";

/**
 * Custom render function that wraps components with necessary providers
 * for testing
 */
function CustomRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(GatewayProvider, {}, children);
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from "@testing-library/react";
export { CustomRender as render };

/**
 * Mock gateway API response
 */
export function mockGatewayResponse<T>(data: T): T {
  return data;
}

/**
 * Mock WebSocket connection
 */
export function mockWebSocket() {
  const mockWebSocket = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1,
  };

  global.WebSocket = jest.fn(() => mockWebSocket) as any;

  return mockWebSocket;
}

/**
 * Wait for async updates in tests
 */
export async function waitForAsync(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create mock event data for testing
 */
export function createMockEventData<T>(type: string, payload: T) {
  return {
    event: type,
    payload,
    timestamp: new Date().toISOString(),
  };
}
