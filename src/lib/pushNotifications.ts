/**
 * Browser Web Push notification support and permission management.
 */

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export function isWebPushSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return Boolean(
    'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
  );
}

export function getPushNotificationPermission(): PushPermissionStatus {
  if (!isWebPushSupported()) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionStatus;
}

export async function requestPushPermission(): Promise<PushPermissionStatus> {
  if (!isWebPushSupported()) {
    return 'unsupported';
  }
  try {
    const status = await Notification.requestPermission();
    return status as PushPermissionStatus;
  } catch {
    return 'default';
  }
}
