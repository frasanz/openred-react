import { useTranslation } from 'react-i18next';
import { es, enUS, type Locale } from 'date-fns/locale';

// Maps an i18n language code to an Intl locale and a date-fns locale.
const INTL_LOCALE: Record<string, string> = { es: 'es-ES', en: 'en-US' };
const DATE_FNS_LOCALE: Record<string, Locale> = { es, en: enUS };

const base = (lng: string) => (lng || 'en').split('-')[0];

export const getIntlLocale = (lng: string): string => INTL_LOCALE[base(lng)] ?? 'en-US';
export const getDateFnsLocale = (lng: string): Locale => DATE_FNS_LOCALE[base(lng)] ?? enUS;

/**
 * Locale-aware formatting helpers bound to the active language.
 * Re-renders automatically when the user switches language.
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const lng = i18n.language || 'en';
  const locale = getIntlLocale(lng);
  const dateFnsLocale = getDateFnsLocale(lng);

  return {
    locale,
    dateFnsLocale,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      value.toLocaleString(locale, options),
    formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleDateString(locale, options),
    formatTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleTimeString(locale, options),
    formatDateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
      new Date(value).toLocaleString(locale, options),
  };
}
