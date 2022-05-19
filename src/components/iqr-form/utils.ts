import { FormLayout } from './legacy/FormLayout'
import ckmeans from 'simple-statistics/src/ckmeans'
import { sortedBy } from '../../utils/no-lodash'
import { FormLayoutData } from './legacy/FormLayoutData'

export function convert(formLayout: FormLayout) {
	return {
		sections:
			formLayout.sections?.map((section) => {
				const filteredFormDataList = (section.formColumns || []).flatMap((c) => (c.formDataList || []).filter((fd) => !(_isLabel(fd) && fd.label === section.title)))

				//Cluster lines
				const sortedList = sortedBy(filteredFormDataList, (fd: FormLayoutData) => fd.editor?.top || 0)
				const clusters = cluster(
					sortedList.map((fd) => fd.editor?.top || 0),
					10,
				).clusters

				const formDataClusters = sortedList
					.reduce(
						(cs, fd) => (cs[clusters.findIndex((c) => c.includes(fd.editor?.top || 0))].push(fd), cs),
						new Array(clusters.length).fill(null).map(() => [] as FormLayoutData[]),
					)
					.map((c) => sortedBy(c, (x) => (x.editor?.left || 0) + (x.editor?.width || 0)))

				//Cluster columns
				const rightClustering = cluster(
					sortedBy(
						filteredFormDataList.map((fd) => (fd.editor?.left || 0) + (fd.editor?.width || 0)),
						(a) => a,
					),
					8,
				)
				//Round centroids
				rightClustering.centroids = rightClustering.centroids.map((c) => Math.round(c / 24) * 24)

				formDataClusters
					.flatMap((x) => x)
					.forEach((c) => {
						c.editor && (c.editor.right = rightClustering.centroids[rightClustering.clusters.findIndex((cc) => cc.includes((c.editor?.left || 0) + (c.editor?.width || 0)))])
					})

				const { maxRight, minLeft } = filteredFormDataList.reduce(
					({ maxRight, minLeft }, i) => ({
						maxRight: Math.max(i.editor?.right || 0, maxRight),
						minLeft: Math.min(i.editor?.left || 0, minLeft),
					}),
					{ maxRight: 32, minLeft: 1000 },
				)

				console.log(`Section : ${section.title}`)
				console.log(`Range : ${minLeft} - ${maxRight}`)

				return formDataClusters.flatMap((x) => x)
			}) || [],
	}
}

function _isLabel(layoutItem: FormLayoutData) {
	return layoutItem.editor?.key === 'Label'
}

function cluster(data: any[], maxDistance: number) {
	if (!data.length) {
		return { centroids: [], clusters: [] }
	}
	let K = Math.max(Math.round(data.length / 5), 1)
	const history = []
	let isntStable = true
	let centroids: number[] = []
	let clusters: number[][] = []
	while (isntStable) {
		history.push(K)
		isntStable = false
		clusters = ckmeans(data, K)
		if (clusters.find((c) => !c.length)) {
			isntStable = true
			K--
			continue
		}
		centroids = clusters.map((a) => a.reduce((v, s) => s + v, 0) / a.length)
		const positions = centroids.sort((a, b) => a - b)

		for (let i = 0; i < positions.length - 1; i++) {
			const dist = Math.abs(positions[i] - positions[i + 1])
			if (dist < maxDistance) {
				if (!history.includes(K - 1)) {
					isntStable = true
					K--
				}
				break
			}
		}
		if (isntStable) {
			continue
		}
		for (let i = 0; i < clusters.length; i++) {
			const maxDistance = clusters[i].reduce((s, v) => Math.max(s, Math.abs(v - centroids[i])), 0)
			if (maxDistance > maxDistance) {
				isntStable = true
				K++
				break
			}
		}
	}
	return { centroids: centroids, clusters: clusters }
}
