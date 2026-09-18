import 'react-i18next';
import { resources, defaultNS } from './i18n';

// Enables type-safe translation keys and namespaces across the app.
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
