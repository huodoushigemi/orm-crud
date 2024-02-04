import { TableXXX } from "../props"

export const user: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'name', prop: 'name', filter: 'contains' },
    { label: 'age', prop: 'age' },
    { label: 'following', prop: 'following', relation: { table: 'user', rel: 'm-n' } },
    { label: 'followedBy', prop: 'followedBy', relation: { table: 'user', rel: 'm-n' } },
    { label: 'comments', prop: 'comments', relation: { table: 'comment', rel: '1-n' } },
    { label: 'posts', prop: 'posts', relation: { table: 'post', rel: '1-n' } }
  ],
  columns: ['id', 'name', 'age'],
  forms: ['name', 'age'],
  searchs: ['name'],
  btns: [],
  map: { label: 'name' }
}

export const post: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'title', prop: 'title' },
    { label: 'content', prop: 'content' },
    { label: '作者', prop: 'author', relation: { table: 'user', rel: 'n-1' } },
    { label: 'tag', prop: 'tag', relation: { table: 'tag', rel: 'm-n' } },
  ],
  columns: ['id', 'title', 'content', 'author'],
  forms: ['title', 'content'],
  searchs: ['title', 'content'],
  btns: [],
  map: { label: 'title' }
}

export const comment: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'content', prop: 'content', filter: 'contains' },
    { label: '评论人', prop: 'speaker', relation: { table: 'user', rel: 'n-1' } },
    { label: '文章', prop: 'post', relation: { table: 'post', rel: 'n-1' } },
    { label: '@', prop: 'comment', relation: { table: 'comment', rel: 'n-1' } },
    { label: 'comments', prop: 'comments', relation: { table: 'comment', rel: '1-n' } },
  ],
  columns: ['id', 'content', 'speaker', 'comment', 'post', 'post.author'],
  forms: ['content', 'post'],
  searchs: ['content'],
  btns: [],
  map: { label: 'content' }
}

export const tag: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'name', prop: 'name', filter: 'contains' },
    { label: 'post', prop: 'post', relation: { table: 'post', rel: 'm-n' } },
  ],
  columns: ['id', 'name'],
  forms: ['name'],
  searchs: ['name'],
  btns: [],
  map: { label: 'name' }
}