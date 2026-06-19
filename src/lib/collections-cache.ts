/**
 * Simple module-level cache for collections data.
 * Prevents multiple MegaMenu instances from each firing their own
 * /api/collections fetch on mount. The first caller triggers the fetch;
 * subsequent callers share the same promise.
 */

type Collection = {
  id: string
  handle: string
  title: string
  description?: string
}

let cachedPromise: Promise<Collection[]> | null = null

export function fetchCollectionsCached(): Promise<Collection[]> {
  if (cachedPromise) return cachedPromise

  cachedPromise = fetch('/api/collections')
    .then(async (res) => {
      if (!res.ok) return []
      const data = await res.json()
      return (data.collections || []) as Collection[]
    })
    .catch(() => {
      // Reset on failure so a retry is possible
      cachedPromise = null
      return [] as Collection[]
    })

  return cachedPromise
}
