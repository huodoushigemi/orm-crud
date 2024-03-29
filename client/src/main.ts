import { createApp, defineComponent, h, reactive } from 'vue'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import './style.css'
import App from './App.vue'
import { NormalizedField } from '@orm-crud/core'
import { RWPermis, FieldRW } from '@orm-crud/ep'
import { get } from 'lodash-es'

const app = createApp(RouterView)
app.use(ElementPlus)

const gteVal = ({ data, field }: { data: any; field: NormalizedField }) => get(data, field.prop)

app.component('my-img', (props) => h('img', { ...props, src: gteVal(props) }))
app.component('my-html', (props) => h('div', { ...props, innerHTML: gteVal(props) }))

app.component('field-rw-input', ({ modelValue }, { emit }) => h(FieldRW, {
    permis: RWPermis(reactive(modelValue ? JSON.parse(modelValue) : {})),
    'onChange': (e) => emit('update:modelValue', JSON.stringify(e.data, (k, v) => v || undefined))
}))


app.use(createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/gfdc_auth_user' },
    // { path: '/', redirect: '/User' },
    { path: '/:table', component: App },
  ]
}))

app.mount('#app')