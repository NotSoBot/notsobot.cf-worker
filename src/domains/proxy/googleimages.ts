import { ApiError, ApiRedirect, RouteHandler } from 'cf-worker-router';

import { fetchStorage } from '../cdn';
import { Domains } from '../../constants';


export default (<RouteHandler> (async (event) => {
  const { parameters, query } = event;

  let url: URL;
  try {
    url = new URL(query.get('url') || '');
  } catch(error) {
    return new ApiError({message: 'Invalid URL'});
  }

  let backupUrl: URL;
  try {
    backupUrl = new URL(query.get('backup') || '');
  } catch(error) {
    return new ApiError({message: 'Invalid Backup URL'});
  }

  let response: Response;
  if (url.hostname === Domains.CDN) {
    response = await fetchStorage(event, url.pathname);
  } else {
    response = await fetch(String(url));
  }

  const mimetype = (response.headers.get('content-type') || '').split(';').shift()!.split(',').shift()!.toLowerCase();
  if (!mimetype.startsWith('image/')) {
    return new ApiRedirect(String(backupUrl), {status: 301});
  }
  return new ApiRedirect(String(url), {status: 301});
}));
