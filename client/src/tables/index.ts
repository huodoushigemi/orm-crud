import * as user from './user'
import * as gfdc from './gfdc'
import { TableOpt } from '@orm-crud/core'

const field_rw: TableOpt = {
  label: '字段权限',
  fields: [
    { prop: 'ID' },
    { label: '权限', prop: 'PERMIS', filter: 'contains', editor: { is: 'field-rw-input' } }
  ],
  columns: ['PERMIS'],
  forms: ['PERMIS'],
  searchs: ['PERMIS'],
  map: { id: 'ID' }
}

const tables = {
  field_rw,
  // ...user,
  ...gfdc
}

export default tables