import { FetchRouter, HttpMethods } from 'cf-worker-router';
import { CloudflareWorkerGlobalScope } from 'types-cloudflare-worker';
declare const self: CloudflareWorkerGlobalScope;

import {
  alphaDomain,
  betaDomain,
  cdnDomain,
  emojisDomain,
  plausibleDomain,
  proxyDomain,
  stableDomain,
} from './domains';
import { fetchStorage } from './domains/cdn';


const router = new FetchRouter();

router.beforeResponse = (response, event) => {
  if (event.originalRequest.headers.has('origin')) {
    response = new Response(response.body, response);
    response.headers.set('access-control-allow-credentials', 'true');
    response.headers.set('access-control-allow-headers', 'Authorization, Content-Type');
    response.headers.set('access-control-allow-methods', Object.values(HttpMethods).join(', '));
    response.headers.set('access-control-allow-origin', '*');
    return response;
  }
};

router.route('/favicon.ico', '*', (event) => {
  return fetchStorage(event, '/assets/stable/favicon.ico');
}, {priority: 100});

router.addRouter(alphaDomain);
router.addRouter(betaDomain);
router.addRouter(cdnDomain);
router.addRouter(emojisDomain);
router.addRouter(plausibleDomain);
router.addRouter(proxyDomain);
router.addRouter(stableDomain);

router.route(['_test.notsobot.com', '_test.notsobot.com/*'], '*', (event) => {
  return fetch('https://cdn.discordapp.com/avatars/300505364032389122/a_0ae61aad39c1bf7b452e08aa2efd3483.gif?size=512');
});

self.addEventListener('fetch', (event) => {
  router.onFetch(event);
});
