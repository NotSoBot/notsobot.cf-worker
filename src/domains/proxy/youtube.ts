import { ApiError, ApiResponse, RouteHandler } from 'cf-worker-router';

import { RPC_KEY } from '../../constants';


const ELChoices = Object.freeze([
  'adunit',
  'detailpage',
  'editpage',
  'embedded',
  'leanback',
  'previewpage',
  'profilepage',
  'unplugged',
  'playlistoverview',
  'sponsorshipsoffer',
  //'info',
]);

const EUrls = Object.freeze([
  'https://youtube.googleapis.com/v/',
  'https://www.youtube-nocookie.com/v/',
  'https://www.youtube.com/v/',
]);

const PlayerStyles = Object.freeze([
  'annotation-editor',
  'blazer',
  'blogger',
  'books',
  'chat',
  'creator-endscreen-editor',
  'desktop-polymer',
  'docs',
  'gmail',
  'google-live',
  'gvn',
  'hangouts-meet',
  'jamboard',
  'lb3',
  'live-dashboard',
  'music-embed',
  'photos-edu',
  'picasaweb',
  'play',
]);

export default (<RouteHandler> (async (event) => {
  const { parameters, query, request } = event;

  //const token = request.headers.get('x-not-so-token');
  const token = query.get('x-key');
  if (token !== 'FUCK') {
    return new ApiError({status: 403});
  }
  request.headers.delete('x-not-so-token');

  request.headers.delete('cf-connecting-ip');
  request.headers.delete('true-client-ip');
  request.headers.delete('x-real-ip');

  const eurl = EUrls[Math.floor(Math.random() * EUrls.length)];

  const url = new URL('https://www.youtube.com/get_video_info');
  url.searchParams.set('asv', '3');
  url.searchParams.set('el', ELChoices[Math.floor(Math.random() * ELChoices.length)]);
  url.searchParams.set('eurl', eurl + parameters.videoId);
  url.searchParams.set('hl', 'en_US');
  url.searchParams.set('html5', '1');
  url.searchParams.set('lact', String(Date.now()));
  url.searchParams.set('ps', PlayerStyles[Math.floor(Math.random() * PlayerStyles.length)]);
  url.searchParams.set('sts', '18179');
  url.searchParams.set('video_id', parameters.videoId);
  const proxy = new Request(String(url), request);
  const response = await fetch(proxy, {cf: {cacheEverything: true, cacheTtl: 600}});
  //const response = await fetch(proxy);
  if (response.ok) {
    const params = <any> new URLSearchParams(await response.text());
    const body = Object.fromEntries(params);

    for (let key of ['adaptive_fmts', 'fflags', 'url_encoded_fmt_stream_map']) {
      const entries = <any> new URLSearchParams(body[key]);
      body[key] = Object.fromEntries(entries);
    }
    for (let key of ['fexp', 'fmt_list', 'watermark']) {
      body[key] = (body[key] || '').split(',');
    }
    for (let key of ['player_response']) {
      if (key in body) {
        body[key] = JSON.parse(body[key]);
      }
    }

    const result: {
      formats: Array<any>,
      url: string,
      raw: any,
    } = {
      formats: [],
      url: url.href,
      raw: body,
    };

    /*
    if ('adaptive_fmts' in body) {
      const format = body['adaptive_fmts'];
      result.formats.defaults.push({
        itag: parseInt(format.itag),
        mimetype: format.type,
        quality: format.quality_label,
        type: format.type.split('/').shift(),
        url: format.url,
      });
    }
    if ('url_encoded_fmt_stream_map' in body) {
      const format = body['url_encoded_fmt_stream_map'];
      result.formats.defaults.push({
        itag: parseInt(format.itag),
        mimetype: format.type,
        quality: format.quality,
        type: format.type.split('/').shift(),
        url: format.url,
      });
    }
    */

    if ('player_response' in body) {
      const { streamingData } = body['player_response'];
      if (streamingData) {
        for (let format of (streamingData.adaptiveFormats || [])) {
          const adaptiveFormat = {
            audio_channels: format.audioChannels,
            audio_sample_rate: format.audioSampleRate,
            bitrate: format.bitrate,
            content_length: parseInt(format.contentLength) || 0,
            duration: parseInt(format.approxDurationMs) || 0,
            itag: format.itag,
            mimetype: format.mimeType,
            quality: format.quality,
            quality_label: format.qualityLabel,
            type: format.mimeType.split('/').shift(),
            url: format.url,
          };
          if (!adaptiveFormat.url && format.cipher) {
            const cipher = new URLSearchParams(format.cipher);
            Object.assign(adaptiveFormat, {
              cipher: Object.fromEntries(<any> cipher),
            });
            const signature = cipher.get('s') || '';
            // decrypt signature here
            const url = new URL(cipher.get('url') || '');
            url.searchParams.set(cipher.get('sp') || 'signature', signature);
            adaptiveFormat.url = url.href;
          }
          result.formats.push(adaptiveFormat);
        }
      }
    }

    if (query.get('download') === 'yes') {
      for (let format of result.formats) {
        if (format.type === 'audio' && format.mimetype.startsWith('audio/webm')) {
          if (typeof(format.url) === 'string') {
            return fetch(format.url);
          }
          return fetch(format.url.url);
        }
      }
    }

    return new ApiResponse(result);
  }
  return new ApiError({message: 'Failed to get youtube data', status: 400});
}));
