import { ApiRedirect, DomainRouter, Helpers, HttpMethods } from 'cf-worker-router';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Body, Head, HTML, MetatagProps } from '../components/HTML';
import { Domains } from '../constants';

import { fetchStorage } from './cdn';
import { PlausibleUrls } from './plausible';


export const router = new DomainRouter(`^${Domains.STABLE_WWW}|^${Domains.STABLE}`);

const DOMAIN = Domains.STABLE;
const VERSION = 'stable';


export interface MetatagsStore {
  [key: string]: string,
}

const DefaultMetatags: MetatagsStore = Object.freeze({
  charset: 'UTF-8',
  description: 'Coolest bot on Discord',
  favicon: '/assets/favicon.ico',
  title: 'NotSoBot',
  'og:site_name': DOMAIN,
  'og:url': `https://${DOMAIN}`,
  'theme-color': '#848585',
  'twitter:card': 'summary',
  //'twitter:site': '@notsobot',
  viewport: 'initial-scale=1.0, minimal-ui, viewport-fit=cover, width=device-width',
});


router.get('/', (event) => {
  return renderHtml(event, DefaultMetatags);
});

router.get('/auth/callback/:token', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `nice token bro ${event.parameters.token}`;
  return renderHtml(event, metatags);
});

router.get('/auth/login', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Login here to view your dashboard`;
  return renderHtml(event, metatags);
});

router.get('/auth/login/callback', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Authentication Callback`;
  return renderHtml(event, metatags);
});

router.get('/auth/logout', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `NotSoLogout`;
  return renderHtml(event, metatags);
});

router.get('/commands', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `So many commands here`;
  return renderHtml(event, metatags);
});

router.get('/dashboard', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `NotSoDashboard`;
  return renderHtml(event, metatags);
});

router.get('/faq', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Frequently Asked Questions`;
  return renderHtml(event, metatags);
});

router.get('/legal/privacy', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Something about privacy`;
  return renderHtml(event, metatags);
});

router.get('/legal/terms', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Something about our terms with some service`;
  return renderHtml(event, metatags);
});

router.get('/status', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Shard Status`;
  return renderHtml(event, metatags);
});

router.get('/support', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `Something about support`;
  return renderHtml(event, metatags);
});


router.route('/*', '*', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `We couldn't find that page, stop that`;
  return renderHtml(event, metatags);
}, {priority: -1});

router.route('/assets/:filename...', '*', (event) => {
  return fetchStorage(event, `/assets/${VERSION}/${event.parameters.filename}`);
});

router.route('/favicon.ico', '*', (event) => {
  return fetchStorage(event, `/assets/${VERSION}/favicon.ico`);
});

router.route(['/api', '/api/:route...'], '*', {pass: true});


async function renderHtml(
  event: Helpers.RouterEvent,
  metatags: Array<MetatagProps> | MetatagsStore = [],
) {
  if (!Array.isArray(metatags)) {
    metatags = Object.entries(metatags).map(([name, content]) => {
      return {name, content};
    });
  }

  const response = await fetchStorage(event, {
    method: HttpMethods.GET,
    pathname: `/assets/${VERSION}/manifest.json`,
  });

  let manifest: {js: string, css: string} | null = null;
  if (response.ok) {
    manifest = await response.json();
  }

  const html = '<!DOCTYPE html>' + renderToStaticMarkup(
    <HTML>
      <Head metatags={metatags}>
        <link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Sarala&display=swap'/>
        {
          (manifest) ? [
            <link rel='stylesheet' href={manifest.css} type='text/css'/>,
            <script src={manifest.js}/>
          ] : null
        }
        <script defer data-domain={DOMAIN} data-api={PlausibleUrls.EVENT} src={PlausibleUrls.SCRIPT}/>
      </Head>
      <Body>
        {(manifest) ? [] : [
          <div className='app'><p>Couldn\'t find any scripts to load, sorry.</p></div>,
        ]}
      </Body>
    </HTML>
  );
  return new Response(html, {headers: {'content-type': 'text/html'}});
}
