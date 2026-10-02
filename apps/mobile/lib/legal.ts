import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Public policy pages on the marketing site (linked from register, login and settings).
export const TERMS_URL = 'https://www.uposa.org/terms';
export const PRIVACY_URL = 'https://www.uposa.org/privacy';
export const ACCOUNT_DELETION_URL = 'https://www.uposa.org/account-deletion';

/** Opens a policy page in the in-app browser, falling back to the system browser. */
export function openLegalPage(url: string) {
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
}
