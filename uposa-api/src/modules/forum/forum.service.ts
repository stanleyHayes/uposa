import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreatePostInput, UpdatePostInput, CreateCommentInput } from './forum.validation';

export async function listPosts(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search } = query;

  const where: Record<string, unknown> = {};
  if (category) where.category = category.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, fullName: true, photoUrl: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.forumPost.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, fullName: true, photoUrl: true } },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, fullName: true, photoUrl: true } },
        },
      },
    },
  });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  // Increment view count
  await prisma.forumPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return post;
}

export async function createPost(authorId: string, data: CreatePostInput) {
  const slug = generateUniqueSlug(data.title);
  return prisma.forumPost.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      category: data.category || 'GENERAL',
      authorId,
    },
    include: {
      author: { select: { id: true, fullName: true, photoUrl: true } },
    },
  });
}

export async function updatePost(postId: string, authorId: string, data: UpdatePostInput, isAdmin: boolean) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (!isAdmin && post.authorId !== authorId) {
    throw Object.assign(new Error('Not authorized to edit this post'), { statusCode: 403 });
  }
  if (post.isLocked && !isAdmin) {
    throw Object.assign(new Error('This post is locked'), { statusCode: 403 });
  }

  return prisma.forumPost.update({
    where: { id: postId },
    data: { ...data },
    include: { author: { select: { id: true, fullName: true, photoUrl: true } } },
  });
}

export async function deletePost(postId: string, authorId: string, isAdmin: boolean) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (!isAdmin && post.authorId !== authorId) {
    throw Object.assign(new Error('Not authorized to delete this post'), { statusCode: 403 });
  }

  await prisma.forumPost.delete({ where: { id: postId } });
  return { message: 'Post deleted successfully' };
}

export async function addComment(postId: string, authorId: string, data: CreateCommentInput) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  if (post.isLocked) {
    throw Object.assign(new Error('This post is locked for comments'), { statusCode: 403 });
  }

  return prisma.forumComment.create({
    data: {
      postId,
      authorId,
      content: data.content,
      parentId: data.parentId || null,
    },
    include: { author: { select: { id: true, fullName: true, photoUrl: true } } },
  });
}

export async function deleteComment(commentId: string, authorId: string, isAdmin: boolean) {
  const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
  if (!isAdmin && comment.authorId !== authorId) {
    throw Object.assign(new Error('Not authorized to delete this comment'), { statusCode: 403 });
  }

  await prisma.forumComment.delete({ where: { id: commentId } });
  return { message: 'Comment deleted successfully' };
}

// Admin services
export async function adminListPosts(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search, isPinned, isLocked } = query;

  const where: Record<string, unknown> = {};
  if (category) where.category = category.toUpperCase();
  if (isPinned !== undefined) where.isPinned = isPinned === 'true';
  if (isLocked !== undefined) where.isLocked = isLocked === 'true';
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.forumPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { select: { id: true, fullName: true, email: true, photoUrl: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.forumPost.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function adminTogglePinPost(postId: string) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  return prisma.forumPost.update({
    where: { id: postId },
    data: { isPinned: !post.isPinned },
    include: { author: { select: { id: true, fullName: true } } },
  });
}

export async function adminToggleLockPost(postId: string) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  return prisma.forumPost.update({
    where: { id: postId },
    data: { isLocked: !post.isLocked },
    include: { author: { select: { id: true, fullName: true } } },
  });
}

export async function adminDeletePost(postId: string) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
  await prisma.forumPost.delete({ where: { id: postId } });
  return { message: 'Post deleted by admin' };
}

export async function adminDeleteComment(commentId: string) {
  const comment = await prisma.forumComment.findUnique({ where: { id: commentId } });
  if (!comment) throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
  await prisma.forumComment.delete({ where: { id: commentId } });
  return { message: 'Comment deleted by admin' };
}

export async function adminUpdatePost(postId: string, data: UpdatePostInput) {
  const post = await prisma.forumPost.findUnique({ where: { id: postId } });
  if (!post) throw Object.assign(new Error('Post not found'), { statusCode: 404 });

  return prisma.forumPost.update({
    where: { id: postId },
    data: { ...data },
    include: { author: { select: { id: true, fullName: true, photoUrl: true } } },
  });
}
