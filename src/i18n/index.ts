import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import enValidation from './locales/en/validation.json';
import esValidation from './locales/es/validation.json';
import enAuth from './locales/en/auth.json';
import esAuth from './locales/es/auth.json';
import enLanding from './locales/en/landing.json';
import esLanding from './locales/es/landing.json';
import enMobile from './locales/en/mobile.json';
import esMobile from './locales/es/mobile.json';
import enMap from './locales/en/map.json';
import esMap from './locales/es/map.json';
import enFilters from './locales/en/filters.json';
import esFilters from './locales/es/filters.json';
import enTracks from './locales/en/tracks.json';
import esTracks from './locales/es/tracks.json';
import enStatistics from './locales/en/statistics.json';
import esStatistics from './locales/es/statistics.json';
import enProfile from './locales/en/profile.json';
import esProfile from './locales/es/profile.json';
import enDevices from './locales/en/devices.json';
import esDevices from './locales/es/devices.json';
import enLegal from './locales/en/legal.json';
import esLegal from './locales/es/legal.json';
import enEsp32 from './locales/en/esp32.json';
import esEsp32 from './locales/es/esp32.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: enCommon,
    validation: enValidation,
    auth: enAuth,
    landing: enLanding,
    mobile: enMobile,
    map: enMap,
    filters: enFilters,
    tracks: enTracks,
    statistics: enStatistics,
    profile: enProfile,
    devices: enDevices,
    legal: enLegal,
    esp32: enEsp32,
  },
  es: {
    common: esCommon,
    validation: esValidation,
    auth: esAuth,
    landing: esLanding,
    mobile: esMobile,
    map: esMap,
    filters: esFilters,
    tracks: esTracks,
    statistics: esStatistics,
    profile: esProfile,
    devices: esDevices,
    legal: esLegal,
    esp32: esEsp32,
  },
} as const;

export const supportedLngs = ['es', 'en'] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    // 'es-ES', 'en-GB', etc. resolve to their base language.
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    defaultNS,
    interpolation: {
      // React already escapes values.
      escapeValue: false,
    },
    detection: {
      // Remembered manual choice wins over the browser language.
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'openred_lang',
      caches: ['localStorage'],
    },
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;
