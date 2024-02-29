import { pick, isEqual, get } from 'lodash-es'

console.log(pick({ a: { b: 1, c: 4 }, b: 2 }, ['a.c', 'a.b']));

console.log(isEqual({a:1}, {a:1}))

console.log(get({ a: 1 }, ['a']));