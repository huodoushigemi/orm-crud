import { TableXXX } from "../props"

const required = true

export const User: TableXXX = {
  label: '用户',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '名称', prop: 'name', required, filter: 'contains' },
    { label: '年龄', prop: 'age', required },
    { label: '邮箱', prop: 'email', required },
    { label: 'following', prop: 'following', relation: { table: 'User', rel: 'm-n' } },
    { label: 'followedBy', prop: 'followedBy', relation: { table: 'User', rel: 'm-n' } },
    { label: '评论', prop: 'comments', relation: { table: 'Comment', rel: '1-n' } },
    { label: '文章', prop: 'posts', relation: { table: 'Post', rel: '1-n' } }
  ],
  columns: ['name', 'age', 'email', 'posts'],
  forms: ['name', { prop: 'age', type: 'input-number' }, 'email'],
  searchs: ['following', 'name', { prop: 'posts.title' }],
  btns: [],
  map: { label: 'name' }
}

export const Post: TableXXX = {
  label: '文章',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '标题', prop: 'title', filter: 'contains' },
    { label: '内容', prop: 'content', html: true, filter: 'contains' },
    { label: '作者', prop: 'author', relation: { table: 'User', rel: 'n-1' } },
    { label: '标签', prop: 'tag', relation: { table: 'Tag', rel: 'm-n' } },
    { label: '评论', prop: 'comments', relation: { table: 'Comment', rel: 'm-n' } },
  ],
  columns: ['title', 'content', 'author', 'author.age', 'tag', 'tag.name'],
  forms: ['title', 'content', 'author', 'tag'],
  searchs: ['title', 'content'],
  btns: [],
  map: { label: 'title' }
}

export const Comment: TableXXX = {
  label: '评论',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '内容', prop: 'content', filter: 'contains' },
    { label: '评论人', prop: 'speaker', relation: { table: 'User', rel: 'n-1' } },
    { label: '文章', prop: 'post', relation: { table: 'Post', rel: 'n-1' } },
    { label: '@', prop: 'reply', relation: { table: 'Comment', rel: 'n-1' } },
    { label: 'comments', prop: 'comments', relation: { table: 'Comment', rel: '1-n' } },
  ],
  columns: ['content', 'speaker', 'reply', 'post', 'post.author'],
  forms: ['content', 'post'],
  searchs: ['content', 'reply'],
  btns: [],
  map: { label: 'content' }
}

export const Tag: TableXXX = {
  label: '标签',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '标签名', prop: 'name', filter: 'contains' },
    { label: '文章', prop: 'posts', relation: { table: 'Post', rel: 'm-n' } },
  ],
  columns: ['name'],
  forms: ['name'],
  searchs: ['name'],
  btns: [],
  map: { label: 'name' }
}