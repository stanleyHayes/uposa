import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateNewsInput, UpdateNewsInput } from './news.validation';

export async function listNews(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search } = query;

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.news.findMany({
      where,
      skip,
      take: limit,
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        imageUrl: true,
        category: true,
        authorName: true,
        isFeatured: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    }),
    prisma.news.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getNewsBySlug(slug: string) {
  const article = await prisma.news.findUnique({
    where: { slug, isPublished: true },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  return article;
}

export async function createNews(adminId: string, data: CreateNewsInput, imageUrl?: string) {
  const slug = generateUniqueSlug(data.title);
  const publishedAt = data.isPublished ? new Date() : null;

  return prisma.news.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      imageUrl: imageUrl || null,
      category: data.category || 'ANNOUNCEMENT',
      authorName: data.authorName,
      isFeatured: data.isFeatured || false,
      isPublished: data.isPublished || false,
      publishedAt,
      createdById: adminId,
    },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function updateNews(id: string, data: UpdateNewsInput, imageUrl?: string) {
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (imageUrl) updateData.imageUrl = imageUrl;

  // If publishing for the first time
  if (data.isPublished && !article.isPublished) {
    updateData.publishedAt = new Date();
  }

  return prisma.news.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function deleteNews(id: string) {
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  await prisma.news.delete({ where: { id } });
  return { message: 'Article deleted successfully' };
}
