import { keyBy, pick, isEqual, get } from 'lodash-es'

console.log(keyBy([{ a: { b: 1 } }], ['a.b']));
// console.log(isRef({ value: 1, [RefSymbol]: true }));
