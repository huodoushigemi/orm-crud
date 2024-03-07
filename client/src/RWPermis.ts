export interface IRWPermis {
  r: (flag: string, plus?: boolean) => boolean
  w: (flag: string, plus?: boolean) => boolean
}

export function RWPermis(map: Record<string, number>): IRWPermis {
  return {
    r: (flag, plus) => 
      plus == true ? !!(map[flag] = (map[flag] || 0) | 4) :
      plus == false ? !!(map[flag] = (map[flag] || 0) & ~4)
      : !!(map[flag] & 4),

    w: (flag, plus) => 
      plus == true ? !!(map[flag] = (map[flag] || 0) | 2) :
      plus == false ? !!(map[flag] = (map[flag] || 0) & ~2)
      : !!(map[flag] & 2),
  }
}
