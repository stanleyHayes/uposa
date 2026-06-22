import { Response } from 'express';
import { RouteRequest } from '../../types/request.types';
import { createPostSchema, updatePostSchema, createCommentSchema } from './forum.validation';
import {
  listPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  adminListPosts,
  adminTogglePinPost,
  adminToggleLockPost,
  adminDeletePost,
  adminDeleteComment,
  adminUpdatePost,
} from './forum.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

export async function listPostsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await listPosts(req.query as Record<string, string | undefined>);
  successResponse(res, 'Posts retrieved', result.data, 200, result.meta);
}

export async function getPostBySlugHandler(req: RouteRequest, res: Response): Promise<void> {
  const { slug } = req.params;
  const post = await getPostBySlug(slug);
  successResponse(res, 'Post retrieved', post);
}

export async function createPostHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const parsed = createPostSchema.parse({ body: req.body });
  const post = await createPost(req.user.id, parsed.body);
  successResponse(res, 'Post created successfully', post, 201);
}

export async function updatePostHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const parsed = updatePostSchema.parse({ body: req.body });
  const post = await updatePost(id, req.user.id, parsed.body, false);
  successResponse(res, 'Post updated successfully', post);
}

export async function deletePostHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user && !req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const actorId = req.user?.id || req.admin?.id || '';
  const isAdmin = !!req.admin;
  const result = await deletePost(id, actorId, isAdmin);
  successResponse(res, result.message);
}

export async function addCommentHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const parsed = createCommentSchema.parse({ body: req.body });
  const comment = await addComment(id, req.user.id, parsed.body);
  successResponse(res, 'Comment added', comment, 201);
}

export async function deleteCommentHandler(req: RouteRequest, res: Response): Promise<void> {
  if (!req.user && !req.admin) {
    errorResponse(res, 'Unauthorized', 401);
    return;
  }
  const { id } = req.params;
  const actorId = req.user?.id || req.admin?.id || '';
  const isAdmin = !!req.admin;
  const result = await deleteComment(id, actorId, isAdmin);
  successResponse(res, result.message);
}

// Admin handlers
export async function adminListPostsHandler(req: RouteRequest, res: Response): Promise<void> {
  const result = await adminListPosts(req.query as Record<string, string | undefined>);
  successResponse(res, 'Posts retrieved', result.data, 200, result.meta);
}

export async function adminTogglePinPostHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await adminTogglePinPost(id);
  successResponse(res, `Post ${post.isPinned ? 'pinned' : 'unpinned'}`, post);
}

export async function adminToggleLockPostHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const post = await adminToggleLockPost(id);
  successResponse(res, `Post ${post.isLocked ? 'locked' : 'unlocked'}`, post);
}

export async function adminDeletePostHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeletePost(id);
  successResponse(res, result.message);
}

export async function adminDeleteCommentHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await adminDeleteComment(id);
  successResponse(res, result.message);
}

export async function adminUpdatePostHandler(req: RouteRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updatePostSchema.parse({ body: req.body });
  const post = await adminUpdatePost(id, parsed.body);
  successResponse(res, 'Post updated by admin', post);
}
