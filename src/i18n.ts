/*
 * @Date: 2026-02-03 19:29:09
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\i18n.ts
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
