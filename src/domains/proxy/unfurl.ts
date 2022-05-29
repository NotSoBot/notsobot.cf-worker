import { ApiError, HttpMethods, RouteHandler } from 'cf-worker-router';

import { fetchStorage } from '../cdn';
import { Domains, ImageMimetypesGif, Mimetypes, TRUSTED_DOMAINS } from '../../constants';
import { ProxyRoutes } from '../../endpoints';

const Regexps = {
  METATAGS: /\<meta.*?\>/g,
  METATAG_PARSE: /<\s*meta\s(?=[^>]*?\b(?:name|property|http-equiv)\s*=\s*(?:"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=)))[^>]*?\bcontent\s*=\s*(?:"\s*([^"]*?)\s*"|'\s*([^']*?)\s*'|([^"'>]*?)(?=\s*\/?\s*>|\s\w+\s*=))[^>]*>/i,
};

const imageTags = ['og:image', 'twitter:image'];


export interface UnfurlBody {
  image?: {
    proxy_url: string,
    trusted: boolean,
    url: string,
  },
  metatags: {[key: string]: string},
}

export default (<RouteHandler> (async (event) => {
  const { parameters, request } = event;

  let url: URL;
  try {
    url = new URL(parameters.url);
  } catch(error) {
    return new ApiError({message: 'Invalid URL'});
  }

  request.headers.delete('cf-connecting-ip');
  request.headers.delete('true-client-ip');
  request.headers.delete('x-real-ip');

  let response: Response;
  if (url.hostname === Domains.CDN) {
    response = await fetchStorage(event, {
      method: HttpMethods.GET,
      pathname: url.pathname,
    });
  } else {
    const copy = new Request(String(url), request);
    response = await fetch(copy, {method: HttpMethods.GET});
  }

  const mimetype = (<string> (response.headers.get('content-type') || '').split(';').shift()).toLowerCase();
  if (mimetype === Mimetypes.TEXT_HTML) {
    const html = await response.text();
    const metatags: {[key: string]: string} = {};

    const tags = html.match(Regexps.METATAGS);
    if (tags) {
      for (let tag of tags) {
        let match = tag.match(Regexps.METATAG_PARSE);
        if (match) {
          match = match.filter((value) => value);
          metatags[match[1].toLowerCase()] = match[2];
        }
      }
    }

    const body: UnfurlBody = {metatags};
    for (let imageTag of imageTags) {
      if (imageTag in metatags) {
        let imageUrl = metatags[imageTag];
        if (imageUrl.startsWith('/')) {
          imageUrl = url.origin + imageUrl;
        }
        try {
          const iurl = new URL(imageUrl);
          body['image'] = {
            proxy_url: ProxyRoutes.IMAGE(imageUrl),
            trusted: TRUSTED_DOMAINS.includes(iurl.hostname),
            url: imageUrl,
          };
        } catch(error) {}
      }
    }

    return body;
  } else if (ImageMimetypesGif.includes(mimetype)) {
    const imageUrl = String(url);
    return (<UnfurlBody> {
      image: {
        proxy_url: ProxyRoutes.IMAGE(imageUrl),
        trusted: TRUSTED_DOMAINS.includes(url.hostname),
        url: imageUrl,
      },
      metatags: {},
    });
  }

  return new ApiError({message: 'Invalid mimetype received from URL', metadata: {mimetype}});
}));
