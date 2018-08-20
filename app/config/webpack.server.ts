import * as path from 'path'
import * as Webpack from 'webpack'

const nodeExternals = require('webpack-node-externals')

function projectPath(...directories: string[]) {
  return path.join(__dirname, '..', ...directories)
}

interface IBloomWebWebpackConfig {
  target: 'node'
  externals: Webpack.ExternalsElement[]
  entry: Webpack.Entry
  output: Webpack.Output
  resolve: Webpack.Resolve
  module: Webpack.NewModule
}

const config: IBloomWebWebpackConfig = {
  // Targeting a node environment
  target: 'node',

  // Ignore C based ndoe externals like the PG adapter
  externals: [nodeExternals()],

  entry: {
    // API api entrypoint
    api: [projectPath('api', 'index.ts')],
    // Delayed job worker entrypoint
    worker: [projectPath('worker', 'worker.ts')],
    whisperWorker: [projectPath('whisperWorker', 'index.ts')],
  },

  output: {
    path: projectPath('build'),
    filename: `[name].js`,
  },

  resolve: {
    modules: [
      projectPath('api'),
      projectPath('worker'),
      projectPath('whisperWorker'),
      projectPath('shared'),
      projectPath('node_modules'),
    ],
    extensions: [
      // Resolve .ts and .tsx in our project
      '.ts',
      '.tsx',
      // Resolve .js files for node_modules
      '.js',
    ],
    alias: {
      '@api': projectPath('api'),
      '@shared': projectPath('shared'),
      '@worker': projectPath('worker'),
      '@whisperWorker': projectPath('whisperWorker'),
    },
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.server.json',
            },
          },
        ],
      },
    ],
  },
}

export default config
