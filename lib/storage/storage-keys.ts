/**
 * Legacy-compatible Storage Keys
 * 
 * These keys match the legacy ImpactStore implementation to ensure
 * compatibility with existing data in LocalStorage.
 * 
 * All keys are versioned (v1) to support future migrations.
 */

export const STORAGE_KEYS = {
  COURSES: 'impact_courses_v1',
  RECORDED_COURSES: 'impact_recorded_courses_v1',
  CATEGORIES: 'impact_categories_v1',
  TRAINEES: 'impact_trainees_v1',
  ORDERS: 'impact_orders_v1',
  COUPONS: 'impact_coupons_v1',
  SETTINGS: 'impact_settings_v1',
  SERVICES: 'impact_services_v1',
  SCHEDULES: 'impact_schedules_v1',
  CURRENT_USER: 'impact_current_user_v1',
  AUTH_CREDENTIALS: 'impact_auth_credentials_v1'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
