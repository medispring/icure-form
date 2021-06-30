const { join, relative, dirname } = require('path')
const { readdir, mkdir, copyFile, readFile, writeFile } = require('fs').promises
const sass = require('sass')

const args = process.argv.slice(2)

async function* getFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true })
	for (const entry of entries) {
		const res = join(dir, entry.name)
		if (entry.isDirectory()) {
			yield* getFiles(res)
		} else {
			yield res
		}
	}
}

;(async () => {
	const src = args[0]
	const dst = args[1]
	for await (const f of getFiles(src)) {
		const df = join(dst, relative(src, f))
		await mkdir(dirname(df), { recursive: true })
		if (f.match(/.+(\.tsx?|\.js)/)) {
			const txt = await readFile(f, 'UTF-8')
			let isFirst = true
			const treated = txt.replaceAll(/import\s+(.+)\s+from\s('(.+?\.s?css)'|"(.+?\.s?css)").*/g, (_, varName, g, sQuotedPath, dQuotedPath) => {
				const scss = join(dirname(f), sQuotedPath || dQuotedPath)
				const { css } = sass.renderSync({ file: scss })
				const replacement = `${isFirst ? "import { css } from 'lit-element';\n" : ''}const ${varName} = css\`${css.toString()}\` `
				isFirst = false
				return replacement
			})
			await writeFile(df, treated)
		} else if (!f.match(/.+(\.s?css)/)) {
			await copyFile(f, df)
		}
	}
})()
