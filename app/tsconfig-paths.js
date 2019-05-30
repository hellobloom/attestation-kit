const tsConfig = require('./tsconfig.json')
const tsConfigPaths = require('tsconfig-paths')

// this is needed for paths to work when running files in the build folder
const baseUrl = './build'
tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
})
