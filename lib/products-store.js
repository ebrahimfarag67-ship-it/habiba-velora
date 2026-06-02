import { get, put } from '@vercel/blob';

export const PRODUCTS_PATH = 'products.json';

export function isProductStoreConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    output += decoder.decode(value, { stream: true });
  }

  output += decoder.decode();
  return output;
}

export async function readProducts() {
  if (!isProductStoreConfigured()) {
    return [];
  }

  const result = await get(PRODUCTS_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return [];
  }

  const text = await streamToText(result.stream);
  const products = JSON.parse(text || '[]');
  return Array.isArray(products) ? products : [];
}

export async function writeProducts(products) {
  await put(PRODUCTS_PATH, JSON.stringify(Array.isArray(products) ? products : []), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
  });
}
