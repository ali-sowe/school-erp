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
import library from '@/locales/en/library.json';
import approvals from '@/locales/en/approvals.json';
import expenses from '@/locales/en/expenses.json';
import leaveRequests from '@/locales/en/leave-requests.json';
import academicCalendar from '@/locales/en/academic-calendar.json';
import communication from '@/locales/en/communication.json';
import school from '@/locales/en/school.json';
import documents from '@/locales/en/documents.json';
import dataImport from '@/locales/en/data-import.json';
import reports from '@/locales/en/reports.json';
import portal from '@/locales/en/portal.json';

// ADR-008: ship with a single locale (English) initially, but route every
// UI string through t() from day one and namespace files by module — so
// adding a second language later is "add a locale folder", not a rewrite.
i18n.use(initReactI18next).init({
  resources: {
    en: { common, auth, dashboard, students, guardians, attendance, admin, classes, teachers, exams, finance, library, approvals, expenses, 'leave-requests': leaveRequests, 'academic-calendar': academicCalendar, communication, school, documents, 'data-import': dataImport, reports, portal },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth', 'dashboard', 'students', 'guardians', 'attendance', 'admin', 'classes', 'teachers', 'exams', 'finance', 'library', 'approvals', 'expenses', 'leave-requests', 'academic-calendar', 'communication', 'school', 'documents', 'data-import', 'reports', 'portal'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes output
  },
});

export default i18n;
