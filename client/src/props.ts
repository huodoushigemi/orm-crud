import { createCruds } from './crud'

type Permute<T extends string, U extends string> = 
  T extends infer A ? A extends string
    ? U extends infer B ? B extends string
      ? `${A}.${B}`
      : never: never
  : never : never;

type XXX<M extends string, N extends string> = M | N | Permute<M, N>

export interface Field {
  label?: string
  prop: string
  filter?: XXX<'contains' | 'endsWith' | 'equals' | 'gt' | 'gte' | 'in' | 'lt' | 'lte' | 'not' | 'notIn' | 'startsWith', 'every' | 'some'>
  required?: boolean
  html?: Boolean
  relation?: {
    table: string
    name?: string
    /** @default '1-1' */
    rel?: '1-1' | '1-n' | 'n-1' | 'm-n'
    label?: string
    prop?: string
  }
}

export interface NormalizedField extends Omit<Field, 'relation'> {
  label: string
  relation?: Required<Field['relation']>
}

export interface TableXXX { 
  fields: Field[]
  columns: (Field | string)[]
  searchs: (Field | string)[]
  forms: (Field | string)[]
  btns: any[]
  map: Partial<{
    label: string
    /** @default 'id' */
    id: string
  }>
}

export interface NormalizedTableXXX {
  fields: NormalizedField[]
  columns: NormalizedField[]
  searchs: NormalizedField[]
  forms: NormalizedField[]
  btns: any[]
  map: Required<TableXXX['map']>
}

export interface ConfigProviderProps {
  tables: Record<string, TableXXX>
}

export interface ConfigProviderContext extends ConfigProviderProps {
  cruds: ReturnType<typeof createCruds>
}