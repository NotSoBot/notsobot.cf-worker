// cdn.notsobot.com: serves files from the storage bucket.
// Every other subdomain routed here (`*.notsobot.com/*` in wrangler.jsonc) is a clean 404. notsobot.com/www/beta are
// notsobot.com-frontend's worker and oasis (umami) has a worker-less route in the dashboard (both more specific than
// the wildcard), and the apex's /api isn't matched by `*.` at all.

export interface Env {
  STORAGE_URL: string,
}


const CDN_HOST = 'cdn.notsobot.com';

const CDN_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const CORS_HEADERS = Object.freeze({
  'access-control-allow-headers': 'Content-Type, Range',
  'access-control-allow-methods': CDN_METHODS.join(', '),
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'Content-Length, Content-Range, Content-Type',
});

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  416: 'Range Not Satisfiable',
  502: 'Bad Gateway',
};


function errorResponse(status: number, headers: Record<string, string> = {}): Response {
  const message = STATUS_MESSAGES[status] || 'Error';
  return new Response(JSON.stringify({code: 0, message: `${status}: ${message}`, status}), {
    status,
    headers: {
      'cache-control': 'public, max-age=60',
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}


async function fetchStorage(request: Request, env: Env, pathname: string): Promise<Response> {
  const url = new URL(env.STORAGE_URL);
  url.pathname = pathname;

  let response: Response;
  try {
    // keeps the request's headers so range requests and conditional (etag) requests still work
    response = await fetch(String(url), {headers: request.headers, method: request.method});
  } catch(error) {
    return errorResponse(502, CORS_HEADERS);
  }

  if (response.status >= 400) {
    // the bucket answers 403 for objects that don't exist
    const status = (response.status === 403) ? 404 : response.status;
    return errorResponse(status, CORS_HEADERS);
  }

  response = new Response(response.body, response);
  for (const header of Array.from(response.headers.keys())) {
    // x-goog-*, x-guploader-*
    if (header.startsWith('x-g')) {
      response.headers.delete(header);
    }
  }
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}


async function handleCdn(request: Request, env: Env, url: URL): Promise<Response> {
  if (!CDN_METHODS.includes(request.method)) {
    return errorResponse(405, {...CORS_HEADERS, allow: CDN_METHODS.join(', ')});
  }
  if (request.method === 'OPTIONS') {
    return new Response(null, {status: 204, headers: {...CORS_HEADERS, 'access-control-max-age': '86400'}});
  }
  if (url.pathname === '/' || url.pathname.endsWith('/')) {
    // no directory listings
    return errorResponse(404, CORS_HEADERS);
  }
  if (url.pathname === '/favicon.ico') {
    return fetchStorage(request, env, '/assets/stable/favicon.ico');
  }
  return fetchStorage(request, env, url.pathname);
}


export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    if (host === CDN_HOST) {
      return handleCdn(request, env, url);
    }
    return errorResponse(404);
  },
} satisfies ExportedHandler<Env>;
