import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import jsx from '@vitejs/plugin-vue-jsx'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

function _resolve(dir: string) {
  return path.resolve(__dirname, dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@orm-crud/core': _resolve('packages/core'),
      '@orm-crud/ep': _resolve('packages/ep')
    }
  },
  plugins: [
    vue(),
    jsx(),
    Components({ resolvers: [IconsResolver()] }),
    Icons({ autoInstall: true }),
    // tsconfigPaths(),
  ],
})
