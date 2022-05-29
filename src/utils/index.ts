export type URIEncodeWrapFunc = (...args: Array<any>) => string;
export type URIEncodeWrapped = {[key: string]: any};

export function URIEncodeWrap(unsafe: URIEncodeWrapped): URIEncodeWrapped {
  const safe: URIEncodeWrapped = {};
  for (let key in unsafe) {
    const path = unsafe[key];
    if (typeof(path) !== 'function') {
      safe[key] = path;
      continue;
    }
    safe[key] = <URIEncodeWrapFunc> ((...args) => {
      args = args.map((arg) => {
        if (!arg) {
          return arg;
        }
        return encodeURIComponent(String(arg));
      });
      return path(...args);
    });
  }
  return Object.freeze(safe);
}
