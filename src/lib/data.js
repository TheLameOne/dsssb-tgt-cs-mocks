// Loads the JSON files built by scripts/build-data.mjs. Each file is fetched at most once per visit.

const cache = new Map();

function load(path) {
  if (!cache.has(path)) {
    const request = fetch(`${import.meta.env.BASE_URL}data/${path}`).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
      return response.json();
    });
    request.catch(() => cache.delete(path));
    cache.set(path, request);
  }
  return cache.get(path);
}

export const fetchManifest = () => load('manifest.json');
export const fetchMock = (id) => load(`mocks/${id}.json`);
export const fetchPractice = (section) => load(`practice/${section}.json`);
