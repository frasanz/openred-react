// The API's address, decided in one place.
//
// This used to be three copies of the same ternary -- src/services/api.ts, and
// twice in src/hooks/useProjects.ts -- each hardcoding the production host, and
// none of them reading REACT_APP_API_URL. That key sat in .env.example, in the
// README and in CORS_SOLUTION.md looking like the way to point a build at a
// different API, and it did nothing at all.
//
// Two environments, two mechanisms:
//
//   development  An empty baseURL, so every call is relative and goes through
//                the dev server's proxy. Which API that proxy forwards to is
//                src/setupProxy.js's business (OPENRED_API_PROXY, default
//                http://localhost:8020). Not this file's.
//
//   production   The full URL, baked into the bundle at build time by Create
//                React App. REACT_APP_API_URL now sets it. Unset, it falls back
//                to the host that was hardcoded before, so a build that passes
//                nothing behaves exactly as it did.
//
// Note the asymmetry is real, not an oversight: a proxy target is read by Node
// at startup and can change without a rebuild, while REACT_APP_API_URL is
// substituted into the JavaScript and is fixed once `npm run build` has run.

const PRODUCTION_FALLBACK = 'https://api.open-red.es';

// A trailing slash would produce `https://api.open-red.es//api/projects/`,
// since every caller concatenates a path that already starts with one.
const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

export const API_BASE_URL: string =
  process.env.NODE_ENV === 'development'
    ? ''
    : stripTrailingSlash(process.env.REACT_APP_API_URL || PRODUCTION_FALLBACK);
