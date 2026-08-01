// Production builds may use the baked-in production default; any non-production
// build throws when the value is missing instead of silently targeting production.
function resolveApiUrl(value, productionDefault, name) {
  if (value) return value;
  if (import.meta.env.PROD) return productionDefault;
  throw new Error(
    `[config] ${name} is not set. Define it in your .env (e.g. ${name}=http://localhost:8000/api). ` +
      'Refusing to fall back to the production API in a non-production build.'
  );
}

const API_BASE_URL = resolveApiUrl(import.meta.env.VITE_API_BASE_URL, 'https://maison-de-noor.com/api', 'VITE_API_BASE_URL');

const API_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  USER_PROFILE: '/user/profile',
  // Add more endpoints as needed
};

export { API_ENDPOINTS, API_BASE_URL };
