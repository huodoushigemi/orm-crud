import { TableXXX } from "../props"

const required = true

export const User: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: '名称', prop: 'name', filter: 'contains', required },
    { label: '年龄', prop: 'age', required },
    { label: '邮箱', prop: 'email', required },
    { label: 'following', prop: 'following', relation: { table: 'User', rel: 'm-n' } },
    { label: 'followedBy', prop: 'followedBy', relation: { table: 'User', rel: 'm-n' } },
    { label: 'comments', prop: 'comments', relation: { table: 'Comment', rel: '1-n' } },
    { label: 'posts', prop: 'posts', relation: { table: 'Post', rel: '1-n' } }
  ],
  columns: ['name', 'age', 'email'],
  forms: ['name', { prop: 'age', type: 'input-number' }, 'email'],
  searchs: ['name'],
  btns: [],
  map: { label: 'name' }
}

export const Post: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'title', prop: 'title' },
    { label: 'content', prop: 'content' },
    { label: '作者', prop: 'author', relation: { table: 'User', rel: 'n-1' } },
    { label: 'tag', prop: 'tag', relation: { table: 'Tag', rel: 'm-n' } },
    { label: '评论', prop: 'comments', relation: { table: 'Comment', rel: 'm-n' } },
  ],
  columns: ['title', 'content', 'author', 'author.age'],
  forms: ['title', 'content', 'author'],
  searchs: ['title', 'content'],
  btns: [],
  map: { label: 'title' }
}

export const Comment: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'content', prop: 'content', filter: 'contains' },
    { label: '评论人', prop: 'speaker', relation: { table: 'User', rel: 'n-1' } },
    { label: '文章', prop: 'post', relation: { table: 'Post', rel: 'n-1' } },
    { label: '@', prop: 'reply', relation: { table: 'Comment', rel: 'n-1' } },
    { label: 'comments', prop: 'comments', relation: { table: 'Comment', rel: '1-n' } },
  ],
  columns: ['content', 'speaker', 'reply', 'post', 'post.author'],
  forms: ['content', 'post'],
  searchs: ['content'],
  btns: [],
  map: { label: 'content' }
}

export const Tag: TableXXX = {
  fields: [
    { label: 'id', prop: 'id' },
    { label: 'name', prop: 'name', filter: 'contains' },
    { label: 'post', prop: 'post', relation: { table: 'Post', rel: 'm-n' } },
  ],
  columns: ['name'],
  forms: ['name'],
  searchs: ['name'],
  btns: [],
  map: { label: 'name' }
}