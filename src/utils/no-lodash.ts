export function groupBy<K, I extends string | number>(
	items: K[],
	grouper: (item: K) => I,
): {
	// @ts-ignore
	[key: I]: K
} {
	return items.reduce((r, v, i, a, k = grouper(v)) => {
		;(r[k as string | number] || (r[k as string | number] = [])).push(v)
		return r
	}, {})
}

export function sortBy<K>(items: K[], key: string, direction = 'asc'): K[] {
	return items.concat().sort(direction === 'asc' ? (a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0) : (a, b) => (a[key] < b[key] ? 1 : b[key] < a[key] ? -1 : 0))
}
