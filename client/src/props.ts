import { createCruds } from './crud'

export interface Field {
  label?: string
  prop: string
  /**
   * @default 'equals'
   * @see [Prisma Reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference#filter-conditions-and-operators)
   */
  filter?: 'contains' | 'endsWith' | 'equals' | 'gt' | 'gte' | 'in' | 'lt' | 'lte' | 'not' | 'notIn' | 'startsWith'
  required?: boolean
  html?: Boolean
  relation?: Omit<Relation, 'prop'>
  // todo
  options?: string
  // todo
  type?: string
  // todo
  editor?: any
  // todo
  render?: any
}

export type FieldColumn = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'render'>
export type FieldForm = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'editor'>
export type FieldView = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'render' | 'html'>

export type Relation = RelationOne | RelationMany

export interface RelationBase {
  table: string
  name?: string
  label?: string
  prop?: string
}

export interface RelationOne extends RelationBase {
  rel?: '1-1' | 'n-1'
}

export interface RelationMany extends RelationBase {
  rel: '1-n' | 'm-n'
}

export interface NormalizedField extends Omit<Field, 'relation'> {
  label: string
  relation?: Required<Relation>
}

export type RelField = NormalizedField & { relation: Required<Relation> }

export interface TableOpt<T = string> {
  label: string
  fields: (Field & { prop: T })[]
  columns: (FieldColumn | string)[]
  searchs: (FieldForm | string)[]
  forms: (FieldForm | string)[]
  views?: (FieldView | string)[]
  btns: any[]
  map: Partial<{
    label: string
    /** @default 'id' */
    id: string
  }>
}

export interface NormalizedTableOpt {
  label: string
  fields: NormalizedField[]
  columns: NormalizedField[]
  searchs: NormalizedField[]
  forms: NormalizedField[]
  readonly rels: RelField[];
  views: NormalizedField[]
  btns: any[]
  map: Required<TableOpt['map']>
}

export interface ConfigProviderProps {
  tables: Record<string, TableOpt>
}

export interface ConfigProviderContext extends ConfigProviderProps {
  cruds: ReturnType<typeof createCruds>
}