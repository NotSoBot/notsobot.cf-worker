import { DomainRouter } from 'cf-worker-router';

import { Domains } from '../../constants';

import imageRoute from './image';
import requestRoute from './request';
import unfurlRoute from './unfurl';
import youtubeRoute from './youtube';


export const router = new DomainRouter(Domains.PROXY);
router.route('/image/:url', imageRoute);
router.route('/request/:url', '*', requestRoute);
router.route('/unfurl/:url', unfurlRoute);
router.route('/youtube/:videoId', youtubeRoute);
