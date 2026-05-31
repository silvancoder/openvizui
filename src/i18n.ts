/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\i18n.ts
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Only the default language is loaded synchronously to minimize initial bundle size (#6).
// All other languages are loaded on demand via loadLanguage().
import en from './locales/en.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
        },
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

/** Dynamically load and apply a locale that isn't bundled at startup. */
export const loadLanguage = async (lang: string): Promise<void> => {
    if (lang === 'en') return; // already loaded
    if (i18n.hasResourceBundle(lang, 'translation')) {
        await i18n.changeLanguage(lang);
        return;
    }
    try {
        const module = await import(`./locales/${lang}.json`);
        i18n.addResourceBundle(lang, 'translation', module.default, true, true);
        await i18n.changeLanguage(lang);
    } catch (e) {
        console.warn(`Failed to load locale "${lang}", falling back to English.`, e);
    }
};

export default i18n;
