/**
 * Dev mode: a bar at the top of the app for switching between people, so you
 * can test a handoff from both ends without signing in and out.
 *
 * On automatically in development builds (`expo start`). Off in exported
 * builds unless EXPO_PUBLIC_DEV_MODE=true, which is handy for a shared demo.
 */
export const isDevMode = __DEV__ || process.env.EXPO_PUBLIC_DEV_MODE === 'true';
