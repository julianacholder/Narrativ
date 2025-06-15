import { user } from './auth'; 
import { pgTable, text, timestamp, uuid, integer, boolean, unique } from 'drizzle-orm/pg-core';

// Posts table
export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  authorId: text('author_id').references(() => user.id, { onDelete: 'cascade' }),
  image: text('image'),
  readTime: text('read_time').default('5 min read'),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Post likes table (many-to-many: users can like posts)
export const postLikes = pgTable('post_likes', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  // Unique constraint: one user can only like a post once
  uniqueUserPost: unique().on(table.postId, table.userId),
}));

// Comments table with replies support
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  parentId: text('parent_id').references((): any => comments.id, { onDelete: 'cascade' }), // Self-reference for replies
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

//  like individual comments
export const commentLikes = pgTable('comment_likes', {
  id: text('id').primaryKey(),
  commentId: text('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  uniqueUserComment: unique().on(table.commentId, table.userId),
}));

// TypeScript types for components
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type PostLike = typeof postLikes.$inferSelect;
export type CommentLike = typeof commentLikes.$inferSelect;

// Useful type for posts with additional data
export type PostWithAuthor = Post & {
  author: string | null;
  likeCount: number;
  commentCount: number;
  isLiked?: boolean;
};

export type CommentWithAuthor = Comment & {
  author: {
    name: string | null;
    avatar: string | null;
  };
  likes: number;
  isLiked: boolean;
  replies?: CommentWithAuthor[];
};