import { DomainRouter } from 'cf-worker-router';

import { Domains } from '../constants';

import { fetchStorage } from './cdn';


export const PlausibleUrls = Object.freeze({
  EVENT: `https://${Domains.PLAUSIBLE}/breathe`,
  SCRIPT: `https://${Domains.PLAUSIBLE}/drink`,
});


export const router = new DomainRouter(Domains.PLAUSIBLE);
const version = 'stable';


const BASE_URL = 'https://plausible.io';


router.post('/breathe', (event) => {
  const { request } = event;
  const proxy = new Request(`${BASE_URL}/api/event`, request);
  proxy.headers.delete('cookie');
  return fetch(proxy, {
    cf: {
      cacheEverything: true,
      cacheTtl: 30,
    },
  });
});


router.get('/drink', (event) => {
  const { request } = event;
  const proxy = new Request(`${BASE_URL}/js/script.js`, request);
  proxy.headers.delete('cookie');
  return fetch(proxy, {
    cf: {
      cacheEverything: true,
      cacheTtl: 30,
    },
  });
});


router.route('/favicon.ico', '*', (event) => {
  return fetchStorage(event, `/assets/${version}/favicon.ico`);
});
