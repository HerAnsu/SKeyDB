const ENABLED_NOTICE_ENV_VALUES = new Set(['1', 'true', 'yes', 'on'])

interface DomainMigrationNoticeEnv {
  DEV?: boolean
  VITE_ENABLE_DOMAIN_MIGRATION_NOTICE?: string | boolean
}

export function isDomainMigrationNoticeLaunchEnabled(
  env: DomainMigrationNoticeEnv = import.meta.env,
): boolean {
  const configured = env.VITE_ENABLE_DOMAIN_MIGRATION_NOTICE
  if (typeof configured === 'boolean') {
    return configured
  }
  if (typeof configured === 'string') {
    return ENABLED_NOTICE_ENV_VALUES.has(configured.trim().toLowerCase())
  }
  return env.DEV === true
}
