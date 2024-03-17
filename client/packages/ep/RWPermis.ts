import { reactive } from 'vue'

export interface IRWPermis<T = any> {
  data: T
  r: (flag: string, plus?: boolean) => boolean
  w: (flag: string, plus?: boolean) => boolean
  clone: () => IRWPermis<T>
}

export function RWPermis(map: Record<string, number>): IRWPermis<Record<string, number>> {
  const permis = {
    data: map,
    
    r: (flag, plus) => 
      plus == true ? !!(permis.data[flag] |= 4) :
      plus == false ? !!(permis.data[flag] &= ~4)
      : !!(permis.data[flag] & 4),

    w: (flag, plus) => 
      plus == true ? !!(permis.data[flag] |= 2) :
      plus == false ? !!(permis.data[flag] &= ~2)
      : !!(permis.data[flag] & 2),

    clone: () => RWPermis(reactive(JSON.parse(JSON.stringify(permis.data))))
  }

  return permis
}
