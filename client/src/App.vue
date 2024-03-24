<script setup lang="ts">
import { computed, ref, watchEffect, getCurrentInstance } from 'vue'
import { usePreferredDark, useDark } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import tables from './tables/index'
import { ConfigProvider, Table, FieldRWDialog, RWPermis } from '@orm-crud/ep'
import { useDialogBind, $ } from '@orm-crud/ep/hooks'

import { extend } from 'umi-request'
import { IApiAdapter } from '@orm-crud/core'

import EpSunny from '~icons/ep/sunny'
import EpMoon from '~icons/ep/moon'

const vm = getCurrentInstance().proxy

const relgraphBind = useDialogBind()
const fieldRwBind = useDialogBind()

const request = extend({
  prefix: '/prisma'
})

const api: IApiAdapter = {
  find: (ctx, data) => request.post(`/find/${ctx.table}`, { data }),
  finds: (ctx, data) => request.post(`/finds/${ctx.table}`, { data }),
  page: (ctx, data) => request.post(`/page/${ctx.table}`, { data }),
  count: (ctx, data) => request.post(`/count/${ctx.table}`, { data }),
  create: (ctx, data) => request.post(`/create/${ctx.table}`, { data }),
  update: (ctx, data) => request.post(`/update/${ctx.table}`, { data }),
  remove: (ctx, data) => request.post(`/remove/${ctx.table}`, { data }),
  removes: (ctx, data) => request.post(`/removes/${ctx.table}`, { data }),
}

// api.
request.interceptors.response.use(async (response, options) => {
  const { status } = response
  if (status != 200) {
    const text = await response.text()
    ElMessage.error(text || status + '')
    throw new Error(text)
  }
  
  if (options.url == '/update/field_rw') {
    await getRWPermis()
  }
  return response
})

const log = (...arg) => console.log(...arg)

// watchEffect(() => log(vm.$route.params))

const table = $(
  () => vm.$route.params.table,
  v => vm.$router.push(`/${v}`)
)

const rwMap = ref({})
const rwPermis = computed(() => RWPermis(rwMap.value))
// getRWPermis()

// function getRWPermis() {
//   return request.post('/find/field_rw', { data: { where: { ID: 'clu10rd0900009qie86kzs47n' } } }).then(e => rwMap.value = JSON.parse(e.PERMIS))
// }


const dark = useDark({ selector: 'html', attribute: 'class', valueDark: 'dark', valueLight: '' })
const admin = ref(true)
</script>

<template>
  <ConfigProvider :tables="tables" :api="api" :rwPermis="admin ? undefined : rwPermis">
    <template #default="{ tables, ctxs }">
      <div>
        <header class="header">
          <span style="font-size: 1.5em; margin-left: 24px;">🎁  —— 不完全重构演示</span>
          <div style="flex: 1"></div>
          <el-switch v-model="admin" style="margin-left: 16px; margin-right: 24px;" size="large" active-text="admin" />
          <el-switch v-model="dark" style="margin-left: 16px; margin-right: 24px;" size="large" :active-action-icon="EpMoon" :inactive-action-icon="EpSunny" />
        </header>

        <aside class="menu">
          <div v-for="ctx in Object.values(ctxs).filter(e => !e.middle)" :class="['item', ctx.table == table && 'is-active']" @click="table = ctx.table">
            {{ ctx.label }}
          </div>
        </aside>
  
        <el-card class="page" body-style="padding: 0">
        <!-- <main class="page"> -->
          <Table :key="table" :table="table" :tableAttrs="{ showOverflowTooltip: true }" />
        <!-- </main> -->
        </el-card>

      </div>
    </template>
  </ConfigProvider>
</template>

<style lang="scss">
.header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 56px;
  line-height: 56px;
  margin-bottom: 12px;
  background-color: var(--el-bg-color-overlay) !important;
  box-shadow: var(--el-box-shadow-light);
  z-index: 9;
}

.menu {
  position: fixed;
  top: 68px;
  left: 0;
  bottom: 0;
  width: 200px;
  overflow: auto;
  background-color: var(--el-bg-color-overlay);
  border-radius: 0 20px 20px 0;
  box-shadow: var(--el-box-shadow);
}

.item {
  position: relative;
  padding: 10px 22px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 100%;
    transition: 300ms all;
    border-radius: 0 20px 20px 0;
    background-color: var(--el-fill-color);
    opacity: 0.4;
    z-index: -1;
  }

  &:hover {

    &::before {
      width: 100%;
      opacity: 1;
    }
  }

  &.is-active {
    color: var(--el-color-primary);

    &::before {
      width: 100%;
      background-color: var(--el-fill-color-dark);
      box-shadow: 0 0 20px -10 #00000080;
      opacity: 1;
    }
  }
}

.page {
  margin-left: 216px;
  margin-right: 16px;
  border-radius: 20px;
  // padding-left: 24px;
}
</style>