import { DomainRouter, Helpers, HttpMethods } from 'cf-worker-router';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Body, Head, HTML, MetatagProps } from '../components/HTML';
import { Domains } from '../constants';

import { fetchStorage } from './cdn';


export const router = new DomainRouter(Domains.EMOJIS);
const version = 'emojis';

export interface MetatagsStore {
  [key: string]: string,
}

const DefaultMetatags: MetatagsStore = Object.freeze({
  favicon: '/assets/favicon.ico',
  charset: 'UTF-8',
  title: 'NotSoEmojis',
  description: 'List of Emojis',
  'theme-color': '#848585',
  'og:site_name': Domains.EMOJIS,
  'og:url': `https://${Domains.EMOJIS}`,
  'twitter:card': 'summary',
  viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
});


router.get('/', (event) => {
  return renderHtml(event, DefaultMetatags);
});


router.route('/*', '*', (event) => {
  const metatags = Object.assign({}, DefaultMetatags) as MetatagsStore;
  metatags.description = `We couldn't find that page, stop that`;
  return renderHtml(event, metatags);
}, {priority: -1});

router.route('/assets/:filename...', '*', (event) => {
  return fetchStorage(event, `/assets/${version}/${event.parameters.filename}`);
});

router.route('/favicon.ico', '*', (event) => {
  return fetchStorage(event, `/assets/${version}/favicon.ico`);
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
    pathname: `/assets/${version}/manifest.json`,
  });

  let manifest: {js: string, css: string} | null = null;
  if (response.ok) {
    manifest = await response.json();
  }

  const html = renderToStaticMarkup(
    <HTML>
      <Head metatags={metatags}>
        {
          (manifest) ? [
            <link rel='stylesheet' href={manifest.css} type='text/css'/>,
            <script src={manifest.js}/>
          ] : null
        }
      </Head>
      <Body>
        {(manifest) ? [] : [
          <div className='app'><p>Couldn't find any scripts to load, sorry.</p></div>,
        ]}
      </Body>
    </HTML>
  );
  return new Response(html, {headers: {'content-type': 'text/html'}});
}
