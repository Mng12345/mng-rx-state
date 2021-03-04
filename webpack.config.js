import HtmlWebpackPlugin from 'html-webpack-plugin'
import {join} from 'path'

export default {
  entry: './example/index.tsx',
  mode: 'development',
  devtool: 'cheap-module-source-map',
  devServer: {
    port: 80
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.t|jsx?$/,
        loader: 'source-map-loader',
        enforce: "pre",
        include: [join(process.cwd(), 'src'), join(process.cwd(), 'example')]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: join(process.cwd(), 'index.html'),
      inject: true
    })
  ]
}

