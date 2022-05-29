import { ApiError, DomainRouter, Helpers, HttpMethods } from 'cf-worker-router';

import { BodylessMethods, Domains, STORAGE_URL } from '../constants';


export const router = new DomainRouter(Domains.CDN);

router.route('/*', [
  HttpMethods.GET,
  HttpMethods.HEAD,
  HttpMethods.OPTIONS,
], async (event) => {
  return await fetchStorage(event, event.url.pathname);
});


export interface FetchStorage extends RequestInit {
  method?: string,
  pathname: string,
}

export async function fetchStorage(
  event: Helpers.RouterEvent,
  options: FetchStorage | string,
): Promise<Response> {
  if (typeof(options) === 'string') {
    options = {pathname: options};
  } else {
    options = Object.assign({}, options);
  }

  const storage = new URL(STORAGE_URL);
  storage.pathname = options.pathname;

  const request = new Request(String(storage), event.request);
  if (options.method && BodylessMethods.includes(options.method)) {
    options.body = null;
  }

  let response = await fetch(request, options);
  if (response.status < 400) {
    response = new Response(response.body, response);

    for (let header of (<any> response.headers).keys()) {
      if (header.startsWith('x-g')) {
        response.headers.delete(header);
      }
    }
  } else {
    let status = response.status;
    if (status === 403) {
      status = 404;
    }
    response = new ApiError({status});
  }
  return response;
}
