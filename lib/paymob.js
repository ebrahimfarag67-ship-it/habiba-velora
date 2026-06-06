import crypto from 'crypto';

function cleanEnv(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '').trim();
}

const PAYMOB_BASE_URL = cleanEnv(process.env.PAYMOB_BASE_URL) || 'https://accept.paymob.com';
const PAYMOB_SECRET_KEY = cleanEnv(process.env.PAYMOB_SECRET_KEY);
const PAYMOB_PUBLIC_KEY = cleanEnv(process.env.PAYMOB_PUBLIC_KEY);
const PAYMOB_HMAC_SECRET = cleanEnv(process.env.PAYMOB_HMAC_SECRET);
const PAYMOB_WALLET_INTEGRATION_ID = cleanEnv(process.env.PAYMOB_WALLET_INTEGRATION_ID || process.env.PAYMOB_INTEGRATION_ID);
const PAYMOB_PAYMENT_METHODS = process.env.PAYMOB_PAYMENT_METHODS || PAYMOB_WALLET_INTEGRATION_ID;

const transactionHmacKeys = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order',
  'owner',
  'pending',
  'source_data_pan',
  'source_data_sub_type',
  'source_data_type',
  'success',
];

export function paymobConfigured() {
  return Boolean(PAYMOB_SECRET_KEY && PAYMOB_PUBLIC_KEY && PAYMOB_HMAC_SECRET && paymentMethods().length);
}

export function paymobHmacConfigured() {
  return Boolean(PAYMOB_HMAC_SECRET);
}

function classifySecret(value) {
  const text = String(value || '').trim();
  if (!text) return 'missing';
  if (text.startsWith('egy_pk_')) return 'public_key';
  if (text.startsWith('egy_sk_')) return 'secret_key';
  if (/^[A-Fa-f0-9]{32,128}$/.test(text)) return 'hex_hmac';
  if (/^[A-Za-z0-9+/=]{80,}$/.test(text)) return 'long_api_key';
  return 'unknown';
}

export function paymobConfigSummary() {
  return {
    configured: paymobConfigured(),
    publicKey: classifySecret(PAYMOB_PUBLIC_KEY),
    publicKeyLength: PAYMOB_PUBLIC_KEY.length,
    secretKey: classifySecret(PAYMOB_SECRET_KEY),
    secretKeyLength: PAYMOB_SECRET_KEY.length,
    hmacSecret: classifySecret(PAYMOB_HMAC_SECRET),
    hmacSecretLength: PAYMOB_HMAC_SECRET.length,
    paymentMethodsCount: paymentMethods().length,
  };
}

function valueToHmacString(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function sourceValue(obj, key) {
  if (key === 'order') return obj?.order?.id ?? obj?.order ?? '';
  if (key === 'source_data_pan') return obj?.source_data?.pan ?? obj?.source_data_pan ?? obj?.['source_data.pan'] ?? '';
  if (key === 'source_data_sub_type') return obj?.source_data?.sub_type ?? obj?.source_data_sub_type ?? obj?.['source_data.sub_type'] ?? '';
  if (key === 'source_data_type') return obj?.source_data?.type ?? obj?.source_data_type ?? obj?.['source_data.type'] ?? '';
  return obj?.[key] ?? '';
}

export function verifyPaymobHmac(payload, expectedHmac) {
  if (!PAYMOB_HMAC_SECRET || !expectedHmac) return false;
  const obj = payload?.obj || payload || {};
  const raw = transactionHmacKeys.map((key) => valueToHmacString(sourceValue(obj, key))).join('');
  const calculated = crypto.createHmac('sha512', PAYMOB_HMAC_SECRET).update(raw).digest('hex');
  const expectedBuffer = Buffer.from(String(expectedHmac), 'hex');
  const calculatedBuffer = Buffer.from(calculated, 'hex');
  return expectedBuffer.length === calculatedBuffer.length && crypto.timingSafeEqual(expectedBuffer, calculatedBuffer);
}

export function paymobCheckoutUrl(clientSecret) {
  const url = new URL('/unifiedcheckout/', PAYMOB_BASE_URL);
  url.searchParams.set('publicKey', PAYMOB_PUBLIC_KEY);
  url.searchParams.set('clientSecret', clientSecret);
  return url.toString();
}

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] || 'Customer',
    last_name: parts.slice(1).join(' ') || parts[0] || 'Customer',
  };
}

function billingData(order) {
  const name = splitName(order.customer);
  return {
    ...name,
    email: order.email || 'customer@habibvelora.local',
    phone_number: order.phone || 'NA',
    street: order.address || order.fullAddress || 'NA',
    building: 'NA',
    floor: 'NA',
    apartment: 'NA',
    city: order.area || order.city || 'NA',
    state: order.governorate || order.city || 'NA',
    country: 'EG',
    postal_code: 'NA',
    shipping_method: 'PKG',
  };
}

function normalizePaymentMethod(value) {
  const method = String(value || '').trim();
  if (!method) return null;
  return /^\d+$/.test(method) ? Number(method) : method;
}

function paymentMethods() {
  return PAYMOB_PAYMENT_METHODS
    .split(',')
    .map(normalizePaymentMethod)
    .filter(Boolean);
}

function paymentMethodVariants() {
  const methods = paymentMethods();
  return [
    methods,
    ...methods.map((method) => [method]),
  ].filter((variant) => variant.length);
}

function intentionUrls() {
  return [
    `${PAYMOB_BASE_URL}/v1/intention/`,
    `${PAYMOB_BASE_URL}/v1/intention`,
  ];
}

export async function createPaymobIntention(order, request) {
  if (!paymobConfigured()) {
    const error = new Error('Paymob is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const amount = Math.max(100, Math.round(Number(order.total || 0) * 100));
  const payload = {
    amount,
    currency: 'EGP',
    special_reference: order.id,
    merchant_order_id: order.id,
    notification_url: `${request.baseUrl}/api/payment-webhook`,
    redirection_url: `${request.baseUrl}/api/payment-webhook`,
    billing_data: billingData(order),
    extras: {
      order_id: order.id,
      invoice_id: order.invoiceId,
      payment_reference: order.paymentReference,
    },
    items: Array.isArray(order.items) ? order.items.map((item) => ({
      name: item.name || 'HabibaVelora product',
      amount: Math.max(1, Math.round(Number(item.price || 0) * 100)),
      quantity: Math.max(1, Number(item.qty) || 1),
      description: [item.option, item.color, item.size].filter(Boolean).join(' / ') || item.name || 'Product',
    })) : [],
  };

  const authSchemes = ['Token'];
  const authKeys = [PAYMOB_SECRET_KEY].filter(Boolean);
  let paymobResponse;
  let responseText = '';
  for (const payment_methods of paymentMethodVariants()) {
    for (const url of intentionUrls()) {
      for (const authKey of authKeys) {
        for (const scheme of authSchemes) {
          paymobResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: scheme === 'raw' ? authKey : `${scheme} ${authKey}`,
            },
            body: JSON.stringify({ ...payload, payment_methods }),
          });
          responseText = await paymobResponse.text();
          if (paymobResponse.ok) {
            break;
          }
          if (![401, 404].includes(paymobResponse.status)) {
            break;
          }
        }
        if (paymobResponse.ok || ![401, 404].includes(paymobResponse.status)) {
          break;
        }
      }
      if (paymobResponse.ok || ![401, 404].includes(paymobResponse.status)) {
        break;
      }
    }
    if (paymobResponse.ok || ![401, 404].includes(paymobResponse.status)) {
      break;
    }
  }

  let data = {};
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { raw: responseText };
  }
  if (!paymobResponse.ok || !data?.client_secret) {
    const error = new Error(data?.detail || data?.message || 'Paymob intention failed.');
    error.statusCode = paymobResponse.status || 502;
    error.details = { paymob: data, config: paymobConfigSummary() };
    throw error;
  }

  return {
    intention: data,
    checkoutUrl: paymobCheckoutUrl(data.client_secret),
  };
}

export function extractPaymobOrderReference(payload) {
  const obj = payload?.obj || payload || {};
  return String(
    obj?.order?.merchant_order_id
      || obj?.merchant_order_id
      || obj?.special_reference
      || obj?.extras?.order_id
      || obj?.order?.special_reference
      || obj?.order_id
      || ''
  );
}

export function extractPaymobGatewayReference(payload) {
  const obj = payload?.obj || payload || {};
  return String(obj?.order?.id || obj?.order || obj?.id || '');
}

export function paymobPaymentStatus(payload) {
  const obj = payload?.obj || payload || {};
  const success = String(obj?.success).toLowerCase() === 'true' || obj?.success === true;
  const pending = String(obj?.pending).toLowerCase() === 'true' || obj?.pending === true;
  if (success && !pending) return 'confirmed';
  return 'failed';
}
