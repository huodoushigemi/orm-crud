import pkg from './package.json' assert { type: 'json' }
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['main.ts'],
  outdir: 'dist',
  bundle: true,
  external: Object.keys(pkg.dependencies),
  platform: 'node',
  format: 'esm',
  charset: 'utf8',
})