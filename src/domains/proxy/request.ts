import { ApiError, RouteHandler } from 'cf-worker-router';

import { fetchStorage } from '../cdn';
import { Domains, RPC_KEY } from '../../constants';


export default (<RouteHandler> (async (event) => {
  const { request, parameters } = event;

  const token = request.headers.get('x-not-so-token');
  if (token !== RPC_KEY) {
    return new ApiError({status: 403});
  }
  request.headers.delete('x-not-so-token');

  let url: URL;
  try {
    url = new URL(parameters.url);
  } catch(error) {
    return new ApiError({message: 'Invalid URL'});
  }

  if (url.hostname === Domains.CDN) {
    return fetchStorage(event, url.pathname);
  }

  request.headers.delete('cf-connecting-ip');
  request.headers.delete('true-client-ip');
  request.headers.delete('x-real-ip');

  const proxy = new Request(String(url), request);
  return fetch(proxy, {
    cf: {
      cacheEverything: true,
      cacheTtl: 30,
    },
  });
}));
