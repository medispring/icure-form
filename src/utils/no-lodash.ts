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

export function sortedBy<K>(items: K[], key: string | ((a: K) => any), direction = 'asc'): K[] {
	if (typeof key === 'function') {
		return items.concat().sort(direction === 'asc' ? (a, b) => (key(a) > key(b) ? 1 : key(b) > key(a) ? -1 : 0) : (a, b) => (key(a) < key(b) ? 1 : key(b) < key(a) ? -1 : 0))
	} else {
		return items.concat().sort(direction === 'asc' ? (a, b) => (a[key] > b[key] ? 1 : b[key] > a[key] ? -1 : 0) : (a, b) => (a[key] < b[key] ? 1 : b[key] < a[key] ? -1 : 0))
	}
}

export function sorted<K>(items: K[], direction = 'asc'): K[] {
	return items.concat().sort(direction === 'asc' ? (a, b) => (a > b ? 1 : b > a ? -1 : 0) : (a, b) => (a < b ? 1 : b < a ? -1 : 0))
}
