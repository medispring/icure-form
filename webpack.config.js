// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require('html-webpack-plugin')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = ({ mode }) => {
	return {
		mode,
		entry: './app/demo-app.ts',
		plugins: [
			new HtmlWebpackPlugin({
				template: 'index.html',
			}),
			new CopyWebpackPlugin({
				patterns: [{ context: 'node_modules/@webcomponents/webcomponentsjs', from: '**/*.js', to: 'webcomponents' }],
			}),
		],
		devtool: mode === 'source-map',
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.yaml$/,
					use: 'raw-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.css|\.s([ca])ss$/,
					use: [
						{
							loader: 'lit-scss-loader',
							options: {
								minify: true, // defaults to false
							},
						},
						'extract-loader',
						'css-loader',
						'sass-loader',
					],
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
	}
}
