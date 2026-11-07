import { useEffect, useState } from 'react';

// Hash routes work on GitHub Pages without any server rewrite, and survive a page refresh.

function parse() {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  return {
    parts: path.split('/').filter(Boolean),
    query: Object.fromEntries(new URLSearchParams(query)),
  };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const update = () => {
      setRoute(parse());
    };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

export function go(path) {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}

/** Moves to a route without adding a back-button step, for example after submitting a paper. */
export function replace(path) {
  const url = new URL(window.location.href);
  url.hash = path.startsWith('/') ? path : `/${path}`;
  window.location.replace(url.toString());
}
