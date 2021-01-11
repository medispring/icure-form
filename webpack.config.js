const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = ({mode}) => {
	return {
		mode,
		plugins: [
			new HtmlWebpackPlugin({
				template: './index.html'
			}),
			new CopyWebpackPlugin({
				patterns: [
					{context: 'node_modules/@webcomponents/webcomponentsjs', from: '**/*.js', to: 'webcomponents'},
				]
			})
		],
		devtool: mode === 'development' ? 'source-map' : 'none',
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.css|\.s(c|a)ss$/,
					use: [{
						loader: 'lit-scss-loader',
						options: {
							minify: true, // defaults to false
						},
					}, 'extract-loader', 'css-loader', 'sass-loader'],
				},
			],
		},
		resolve: {
			extensions: ['.tsx', '.ts', '.js'],
		},
	};
};
