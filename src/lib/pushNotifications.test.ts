import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getPushNotificationPermission,
  isWebPushSupported,
  requestPushPermission,
} from './pushNotifications';

describe('pushNotifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reports unsupported in non-browser environment', () => {
    const originalWindow = global.window;
    // @ts-expect-error test node environment
    global.window = undefined;
    expect(isWebPushSupported()).toBe(false);
    expect(getPushNotificationPermission()).toBe('unsupported');
    global.window = originalWindow;
  });

  it('requests permission when supported', async () => {
    const mockRequestPermission = vi.fn().mockResolvedValue('granted');
    const mockNotification = {
      permission: 'default',
      requestPermission: mockRequestPermission,
    };
    const fakeWindow = {
      PushManager: {},
      Notification: mockNotification,
    };
    // @ts-expect-error mock window
    global.window = fakeWindow;
    Object.defineProperty(global, 'Notification', {
      value: mockNotification,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { serviceWorker: {} },
      writable: true,
      configurable: true,
    });

    expect(isWebPushSupported()).toBe(true);
    expect(getPushNotificationPermission()).toBe('default');
    const result = await requestPushPermission();
    expect(result).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);

    // Clean up
    // @ts-expect-error cleanup
    delete global.window;
  });
});
