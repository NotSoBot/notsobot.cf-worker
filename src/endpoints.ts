import { Domains } from './constants';
import { URIEncodeWrap } from './utils';


export const ProxyRoutes = URIEncodeWrap({
  IMAGE: (url: string): string =>
    `https://${Domains.PROXY}/image/${url}`,
  REQUEST: (url: string): string =>
    `https://${Domains.PROXY}/request/${url}`,
  UNFURL: (url: string): string =>
    `https://${Domains.PROXY}/unfurl/${url}`,
});
