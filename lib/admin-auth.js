const LEGACY_ADMIN_PASSWORD = '172005';

export function isAdminRequest(request) {
  const configuredPassword = String(process.env.ADMIN_PASSWORD || LEGACY_ADMIN_PASSWORD).trim();
  const providedPassword = String(request.headers['x-admin-password'] || '').trim();

  return providedPassword === configuredPassword;
}

export function adminAuthMessage() {
  return 'Unauthorized.';
}
