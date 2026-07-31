import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import common from '@/locales/en/common.json';
import auth from '@/locales/en/auth.json';
import dashboard from '@/locales/en/dashboard.json';
import students from '@/locales/en/students.json';
import guardians from '@/locales/en/guardians.json';
import attendance from '@/locales/en/attendance.json';
import admin from '@/locales/en/admin.json';
import classes from '@/locales/en/classes.json';
import teachers from '@/locales/en/teachers.json';
import exams from '@/locales/en/exams.json';
import finance from '@/locales/en/finance.json';

// ADR-008: ship with a single locale (English) initially, but route every
// UI string through t() from day one and namespace files by module — so
// adding a second language later is "add a locale folder", not a rewrite.
i18n.use(initReactI18next).init({
  resources: {
    en: { common, auth, dashboard, students, guardians, attendance, admin, classes, teachers, exams, finance },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth', 'dashboard', 'students', 'guardians', 'attendance', 'admin', 'classes', 'teachers', 'exams', 'finance'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes output
  },
});

export default i18n;
