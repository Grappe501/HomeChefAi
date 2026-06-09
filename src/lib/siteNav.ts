/** Cross-links between marketing site and authenticated app (same origin on Netlify). */

export const MARKETING_HOME = '/landing';
export const APP_HOME = '/';
export const APP_LOGIN = '/login';

export function appEntryPath(isLoggedIn: boolean): string {
  return isLoggedIn ? APP_HOME : APP_LOGIN;
}
