import { TableOpt } from '@orm-crud/core'

const required = true

export const User: TableOpt = {
  label: '用户',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '名称', prop: 'name', required, filter: 'contains', editor: { type: 'textarea', autosize: { minRows: 4 } } },
    { label: '年龄', prop: 'age', required, editor: { is: 'el-input-number' } },
    { prop: 'sex', required, options: [{ label: 'man', value: 0 }, { label: 'woman', value: 1 }] },
    { label: '邮箱', prop: 'email', required, render: { is: 'my-img', height: 48 } },
    { label: 'following', prop: 'following', relation: { table: 'User', rel: 'm-n' }, inverseSide: { prop: 'followedBy' } },
  ],
  columns: ['id', 'name', { label: '岁', prop: 'age' }, { prop: 'sex', fixed: 'right' }, 'videos.video'],
  forms: ['name', { prop: 'age', el: { max: 100 } }, 'sex', 'email', 'following', { prop: 'videos.video' }],
  searchs: ['following', 'videos.video', 'name', { prop: 'posts.title' }],
  map: { label: 'name' }
}

export const Post: TableOpt = {
  label: '文章',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '标题', prop: 'title', filter: 'contains' },
    { label: '内容', prop: 'content', filter: 'contains', editor: { type: 'textarea', autosize: { minRows: 4 } }, render: { is: 'my-html' } }, 
    { label: '作者', prop: 'author', relation: { table: 'User', rel: 'n-1' }, inverseSide: { label: '文章', prop: 'posts' } },
    { label: '标签', prop: 'tag', relation: { table: 'Tag', rel: 'm-n' }, inverseSide: { label: '标签', prop: 'posts' } },
  ],
  columns: ['title', 'content', 'author', 'tag'],
  forms: ['title', 'content', 'author', 'tag'],
  searchs: ['title', 'content', 'author'],
  map: { label: 'title' }
}

export const Comment: TableOpt = {
  label: '评论',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '内容', prop: 'content', filter: 'contains', required: true },
    { label: '文章', prop: 'post', required: true, relation: { table: 'Post', rel: 'n-1' }, inverseSide: { label: '评论', prop: 'comments' } },
    { label: '评论人', prop: 'speaker', required: true, relation: { table: 'User', rel: 'n-1' }, inverseSide: { label: '评论', prop: 'comments' } },
    { label: '@', prop: 'reply', relation: { table: 'Comment', rel: 'n-1' }, inverseSide: { label: '评论', prop: 'comments' } },
  ],
  columns: ['content', 'speaker', 'reply', 'post', 'post.author'],
  forms: ['content', 'post', 'speaker'],
  searchs: ['content', 'reply'],
  map: { label: 'content' }
}

export const Tag: TableOpt = {
  label: '标签',
  fields: [
    { label: 'id', prop: 'id' },
    { label: '标签名', prop: 'name', filter: 'contains' },
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
    { prop: 'size', editor: { is: 'el-input-number' } },
    { prop: 'type' },
    { prop: 'duration', editor: { is: 'el-slider' } },
  ],
  columns: ['id', 'filename', 'users.id', 'users.user'],
  forms: ['filename', 'size', 'type', 'duration', 'users.user'],
  map: { label: 'filename' }
}

export const User_Video: TableOpt = {
  label: '',
  fields: [
    { prop: 'id' },
    { label: '用户', prop: 'user', relation: { table: 'User', rel: 'n-1' }, inverseSide: { label: '视频', prop: 'videos' } },
    { label: '视频', prop: 'video', relation: { table: 'Video', rel: 'n-1' }, inverseSide: { label: '用户', prop: 'users' } },
  ],
  columns: ['id', 'user', 'video'],
  middle: true,
  map: { label: 'id' }
}