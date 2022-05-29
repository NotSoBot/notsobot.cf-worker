import { ApiError, RouteHandler } from 'cf-worker-router';

import { fetchStorage } from '../cdn';
import { Domains, ImageMimetypes, ImageMimetypesGif, Mimetypes } from '../../constants';


export default (<RouteHandler> (async (event) => {
  const { parameters, query } = event;

  let url: URL;
  try {
    url = new URL(parameters.url);
  } catch(error) {
    return new ApiError({message: 'Invalid URL'});
  }

  let response: Response;
  if (url.hostname === Domains.CDN) {
    response = await fetchStorage(event, url.pathname);
  } else {
    response = await fetch(String(url));
  }

  const mimetype = (<string> (response.headers.get('content-type') || '').split(';').shift()).toLowerCase();
  const gif = (query.get('gifs') || 'allow').toLowerCase();

  let whitelist: Array<string>;
  if (gif === 'force') {
    whitelist = [Mimetypes.IMAGE_GIF];
  } else if (gif === 'allow') {
    whitelist = <Array<string>> ImageMimetypesGif;
  } else {
    whitelist = <Array<string>> ImageMimetypes;
  }

  if (!whitelist.includes(mimetype)) {
    return new ApiError({message: 'URL returned a non-image mimetype', metadata: {mimetype}});
  }
  return response;
}));
