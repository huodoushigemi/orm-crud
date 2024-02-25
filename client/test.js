import { pick } from 'lodash-es'

console.log(pick({ a: { b: 1 }, b: 2 }, ['a.b', 'b']));