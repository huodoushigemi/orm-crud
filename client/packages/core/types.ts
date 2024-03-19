import { IApiAdapter } from './adapter/interface'
export * from './adapter/interface'

export type Field = FieldBase

export interface FieldBase {
  label?: string
  prop: string
  relation?: Relation
  inverseSide?: Omit<InverseSide, 'table'>
  /**
   * @default 'equals'
   * @see [Prisma Reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference#filter-conditions-and-operators)
   */
  filter?: 'contains' | 'endsWith' | 'equals' | 'gt' | 'gte' | 'in' | 'lt' | 'lte' | 'not' | 'notIn' | 'startsWith'
  required?: boolean
  options?: any[]
  // todo
  type?: string
  editor?: { [k: string]: any; is?: string }
  render?: { [k: string]: any; is: string }
  // todo
  searcher?: { [k: string]: any; is: string }
  // todo
  select?: { [k: string]: any; is: string }
  // todo
  /** @default true */
  editable?: boolean
}

export type FieldColumn = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'render'>
export type FieldForm = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'editor' | 'editable' | 'required'>
export type FieldView = Pick<Field, 'label' | 'prop' | 'options' | 'type' | 'render'>

export interface Relation {
  table: string
  name?: string
  label?: string
  prop?: string
  rel: '1-1' | '1-n' | 'n-1' | 'm-n'
}

export interface InverseSide {
  table: string
  label?: string
  prop: string
}

export type RelField = FieldBase & {
  relation: Relation
}

export interface NormalizedField extends Field {
  label: string
  relation?: Required<Relation> & { prop: string }
  inverseSide?: Required<InverseSide>
}

export type NRelField = NormalizedField & {
  relation: Required<Relation>
  inverseSide: Required<InverseSide>
}

export interface TableOpt<T = string> {
  label: string
  fields: (Field & { prop: T })[]
  columns?: (FieldColumn | string)[]
  searchs?: (FieldForm | string)[]
  forms?: (FieldForm | string)[]
  views?: (FieldView | string)[]
  btns?: any[]
  middle?: boolean
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
  middle: boolean
  map: Required<TableOpt['map']>
}

export type TableCtx = NormalizedTableOpt & { 
  table: string
  keybyed: Record<string, NormalizedField>
  tables: Record<string, TableOpt>
  ctxs: Record<string, TableCtx>
  api: { [K in keyof IApiAdapter]: IApiAdapter[K] extends (...arg: infer Arg) => any ? Arg extends [any, ...infer O] ? (...arg: O) => ReturnType<IApiAdapter[K]> : never  : never }
}

export type FieldFilter = (ctx: TableCtx, prop: string) => boolean
export type TableCtxs = Record<string, TableCtx>