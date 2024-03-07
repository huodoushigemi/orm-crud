import { TableOpt } from '@orm-crud/core'

const required = true

export const User: TableOpt = {
  label: '用户',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '名称', prop: 'name', required, filter: 'contains' },
    { label: '年龄', prop: 'age', required },
    { label: '邮箱', prop: 'email', required },
    { label: 'following', prop: 'following', relation: { table: 'User', rel: 'm-n' } },
    { label: 'followedBy', prop: 'followedBy', relation: { table: 'User', rel: 'm-n' } },
    { label: '评论', prop: 'comments', relation: { table: 'Comment', rel: '1-n' } },
    { label: '文章', prop: 'posts', relation: { table: 'Post', rel: '1-n' } },
    { label: '视频', prop: 'videos', relation: { table: 'User_Video', rel: '1-n' } },
  ],
  columns: ['id', 'name', 'age', 'email', 'posts', 'videos.video'],
  forms: ['name', { prop: 'age', editor: 'el-input-number' }, 'email', 'following', { prop: 'videos.video' }],
  searchs: ['following', 'videos.video', 'name', { prop: 'posts.title' }],
  btns: [],
  map: { label: 'name' }
}

export const Post: TableOpt = {
  label: '文章',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '标题', prop: 'title', filter: 'contains' },
    { label: '内容', prop: 'content', html: true, filter: 'contains' },
    { label: '作者', prop: 'author', relation: { table: 'User', rel: 'n-1' } },
    { label: '标签', prop: 'tag', relation: { table: 'Tag', rel: 'm-n' } },
    { label: '评论', prop: 'comments', relation: { table: 'Comment', rel: 'm-n' } },
  ],
  columns: ['title', 'content', 'author', 'tag'],
  forms: ['title', 'content', 'author', 'tag'],
  searchs: ['title', 'content'],
  btns: [],
  map: { label: 'title' }
}

export const Comment: TableOpt = {
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

export const Tag: TableOpt = {
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

export const Video: TableOpt = {
  label: '视频',
  fields: [
    { prop: 'id' },
    { prop: 'filename' },
    { prop: 'size', editor: 'el-input-number' },
    { prop: 'type' },
    { prop: 'duration', editor: 'el-slider' },
    { label: '用户', prop: 'users', relation: { table: 'User_Video', rel: '1-n', label: 'user.name' } },
  ],
  columns: ['id', 'filename', 'users.id', 'users.user'],
  forms: ['filename', 'size', 'type', 'duration', 'users.user'],
  map: { label: 'filename' }
}

export const User_Video: TableOpt = {
  label: '',
  fields: [
    { prop: 'id' },
    { label: '用户', prop: 'user', relation: { table: 'User', rel: 'n-1' } },
    { label: '视频', prop: 'video', relation: { table: 'Video', rel: 'n-1' } },
  ],
  columns: ['id', 'user', 'video'],
  middle: true,
  map: { label: 'id' }
}