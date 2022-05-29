declare const __RPC_KEY__: string;
declare const __STORAGE_URL__: string;

import { HttpMethods } from 'cf-worker-router';


export const RPC_KEY = __RPC_KEY__;
export const STORAGE_URL = __STORAGE_URL__;

export const BodylessMethods = Object.freeze([
  HttpMethods.GET,
  HttpMethods.HEAD,
  HttpMethods.OPTIONS,
]);

export const Domains = Object.freeze({
  ALPHA: 'alpha.notsobot.com',
  BETA: 'beta.notsobot.com',
  CDN: 'cdn.notsobot.com',
  EMOJIS: 'emojis.notsobot.com',
  PLAUSIBLE: 'plausible.notsobot.com',
  PROXY: 'proxy.notsobot.com',
  STABLE: 'notsobot.com',
  STABLE_WWW: 'www.notsobot.com',
});

export const Mimetypes = Object.freeze({
  IMAGE_BMP: 'image/bmp',
  IMAGE_GIF: 'image/gif',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_JPG: 'image/jpg',
  IMAGE_PJPEG: 'image/pjpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_WEBP: 'image/webp',
  IMAGE_X_ICON: 'image/x-icon',
  IMAGE_X_MS_BMP: 'image/x-ms-bmp',
  TEXT_HTML: 'text/html',
});

export const ImageMimetypes = Object.freeze([
  Mimetypes.IMAGE_BMP,
  Mimetypes.IMAGE_JPEG,
  Mimetypes.IMAGE_JPG,
  Mimetypes.IMAGE_PJPEG,
  Mimetypes.IMAGE_PNG,
  Mimetypes.IMAGE_WEBP,
  Mimetypes.IMAGE_X_ICON,
  Mimetypes.IMAGE_X_MS_BMP,
]);

export const ImageMimetypesGif = Object.freeze([
  ...ImageMimetypes,
  Mimetypes.IMAGE_GIF,
]);

export const MetatagNames = Object.freeze({
  CHARSET: 'charset',
  FAVICON: 'favicon',
  TITLE: 'title',
});


export const DISCORD_DOMAINS = Object.freeze([
  'canary.discordapp.com',
  'cdn.discordapp.com',
  'discord.gift',
  'discord.gg',
  'discordapp.com',
  'images-ext-1.discordapp.net',
  'images-ext-2.discordapp.net',
  'media.discordapp.net',
  'router.discordapp.net',
]);

export const TRUSTED_DOMAINS = Object.freeze([
  ...Object.values(Domains),
  ...DISCORD_DOMAINS,
  'cdn.files.gg',
  'files.gg',
]);
