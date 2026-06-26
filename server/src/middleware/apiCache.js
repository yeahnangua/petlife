const NO_STORE = 'no-store'

const PUBLIC_CACHE = {
  standard: 'public, max-age=60, s-maxage=300, stale-while-revalidate=60',
  long: 'public, max-age=300, s-maxage=600, stale-while-revalidate=300',
  short: 'public, max-age=10, s-maxage=30, stale-while-revalidate=10'
}

const PUBLIC_CACHE_RULES = [
  {
    matches: (path) => path === '/api/public/categories',
    header: PUBLIC_CACHE.long
  },
  {
    matches: (path) => /^\/api\/public\/stores\/[^/]+\/slots$/.test(path),
    header: PUBLIC_CACHE.short
  },
  {
    matches: (path) => path.startsWith('/api/public/'),
    header: PUBLIC_CACHE.standard
  }
]

function findPublicCacheHeader(req) {
  if (req.method !== 'GET') {
    return null
  }

  const rule = PUBLIC_CACHE_RULES.find((item) => item.matches(req.path))
  return rule?.header ?? null
}

export function apiCache(req, res, next) {
  if (!req.path.startsWith('/api/')) {
    next()
    return
  }

  res.set('Cache-Control', findPublicCacheHeader(req) ?? NO_STORE)
  next()
}
