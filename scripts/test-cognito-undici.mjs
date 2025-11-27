import { performance } from 'perf_hooks';

const REGION = process.env.COGNITO_REGION || 'af-south-1';
const ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

async function tryFetch(timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    console.log(`Attempting fetch to ${ENDPOINT} with timeout ${timeoutMs}ms`);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    const dur = Math.round(performance.now() - start);
    console.log(`Response status: ${res.status} (${res.statusText}) after ${dur}ms`);
    try {
      const json = await res.json();
      console.log('Body:', JSON.stringify(json, null, 2));
    } catch (err) {
      console.log('Response body not JSON or empty');
    }
    clearTimeout(id);
    return res;
  } catch (err) {
    const dur = Math.round(performance.now() - start);
    console.error(`Fetch error after ${dur}ms:`, err?.message || err);
    throw err;
  }
}

(async () => {
  try {
    // Try a few different timeouts to see behaviour
    await tryFetch(5000).catch(() => {});
    await tryFetch(10000).catch(() => {});
    await tryFetch(20000).catch(() => {});
  } catch (err) {
    console.error('Finished with error:', err);
    process.exit(1);
  }
})();
