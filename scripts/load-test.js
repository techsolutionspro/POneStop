// Load test using k6 (install: brew install k6)
// Run: k6 run scripts/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Hold at 50 users
    { duration: '30s', target: 100 }, // Spike to 100
    { duration: '1m', target: 100 },  // Hold peak
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% failure rate
  },
};

const ADMIN_CREDS = { email: 'admin@pharmacyonestop.co.uk', password: 'SuperAdmin1!' };
const OWNER_CREDS = { email: 'amir@highstreetpharmacy.co.uk', password: 'Owner123!' };

export function setup() {
  const adminLogin = http.post(`${BASE_URL}/auth/login`, JSON.stringify(ADMIN_CREDS), { headers: { 'Content-Type': 'application/json' } });
  const ownerLogin = http.post(`${BASE_URL}/auth/login`, JSON.stringify(OWNER_CREDS), { headers: { 'Content-Type': 'application/json' } });
  return {
    adminToken: JSON.parse(adminLogin.body).data.accessToken,
    ownerToken: JSON.parse(ownerLogin.body).data.accessToken,
  };
}

export default function (data) {
  const headers = { 'Content-Type': 'application/json' };
  const authHeaders = { ...headers, Authorization: `Bearer ${data.ownerToken}` };
  const adminHeaders = { ...headers, Authorization: `Bearer ${data.adminToken}` };

  // Public endpoints
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health OK': (r) => r.status === 200 });

  const storefront = http.get(`${BASE_URL}/services/storefront/high-street-pharmacy`);
  check(storefront, { 'storefront OK': (r) => r.status === 200 });

  // Authenticated endpoints
  const me = http.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
  check(me, { '/me OK': (r) => r.status === 200 });

  const dashboard = http.get(`${BASE_URL}/dashboard/tenant`, { headers: authHeaders });
  check(dashboard, { 'dashboard OK': (r) => r.status === 200 });

  const services = http.get(`${BASE_URL}/services`, { headers: authHeaders });
  check(services, { 'services OK': (r) => r.status === 200 });

  const bookings = http.get(`${BASE_URL}/bookings`, { headers: authHeaders });
  check(bookings, { 'bookings OK': (r) => r.status === 200 });

  const orders = http.get(`${BASE_URL}/orders`, { headers: authHeaders });
  check(orders, { 'orders OK': (r) => r.status === 200 });

  // Admin endpoints
  const tenants = http.get(`${BASE_URL}/tenants`, { headers: adminHeaders });
  check(tenants, { 'tenants OK': (r) => r.status === 200 });

  const pgds = http.get(`${BASE_URL}/pgds`, { headers: adminHeaders });
  check(pgds, { 'pgds OK': (r) => r.status === 200 });

  sleep(1);
}
