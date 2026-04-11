import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateNewsInput, UpdateNewsInput } from './news.validation';

async function attachCreatedByMany(docs: Record<string, any>[]) {
  const adminIds = [...new Set(docs.map(d => d.createdById).filter(Boolean))];
  if (adminIds.length === 0) return docs.map(d => ({ ...d, createdBy: null }));
  const repos = getRepos();
  const adminDocs = await repos.admins.findMany({ _id: { $in: adminIds } }, { projection: 'fullName' });
  const adminMap = new Map(adminDocs.map(a => [a.id, { id: a.id, fullName: a.fullName }]));
  return docs.map(d => ({ ...d, createdBy: adminMap.get(d.createdById) || null }));
}

async function attachCreatedBy(doc: Record<string, any>) {
  if (!doc.createdById) return { ...doc, createdBy: null };
  const repos = getRepos();
  const admin = await repos.admins.findById(doc.createdById, { projection: 'fullName' });
  return { ...doc, createdBy: admin ? { id: admin.id, fullName: admin.fullName } : null };
}

export async function listNews(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = { isPublished: true };
  if (category) where.category = category.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const selectFields = 'title slug excerpt imageUrl category authorName isFeatured isPublished publishedAt createdAt createdById';

  const [rawData, total] = await Promise.all([
    repos.news.findMany(where, { projection: selectFields, sort: { publishedAt: -1 }, skip, limit }),
    repos.news.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function listNewsAdmin(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { category, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (category) where.category = category.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.news.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.news.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getNewsBySlug(slug: string) {
  const repos = getRepos();
  const article = await repos.news.findOne({ slug, isPublished: true });
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  const withAdmin = await attachCreatedBy(article);
  return withAdmin;
}

export async function getNewsById(id: string) {
  const repos = getRepos();
  const article = await repos.news.findById(id);
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  const withAdmin = await attachCreatedBy(article);
  return withAdmin;
}

export async function createNews(adminId: string, data: CreateNewsInput, imageUrl?: string) {
  const repos = getRepos();
  const slug = generateUniqueSlug(data.title);
  const publishedAt = data.isPublished ? new Date() : null;

  const article = await repos.news.create({
    title: data.title,
    slug,
    content: data.content,
    excerpt: data.excerpt || null,
    imageUrl: imageUrl || null,
    category: data.category || 'ANNOUNCEMENT',
    authorName: data.authorName || null,
    isFeatured: data.isFeatured || false,
    isPublished: data.isPublished || false,
    publishedAt,
    createdById: adminId,
  });

  const withAdmin = await attachCreatedBy(article);
  return withAdmin;
}

export async function updateNews(id: string, data: UpdateNewsInput, imageUrl?: string) {
  const repos = getRepos();
  const article = await repos.news.findById(id);
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (imageUrl) updateData.imageUrl = imageUrl;
  if (data.isPublished && !article.isPublished) {
    updateData.publishedAt = new Date();
  }

  const result = await repos.news.updateById(id, updateData);
  const withAdmin = await attachCreatedBy(result!);
  return withAdmin;
}

export async function deleteNews(id: string) {
  const repos = getRepos();
  const article = await repos.news.findById(id);
  if (!article) throw Object.assign(new Error('Article not found'), { statusCode: 404 });
  await repos.news.deleteById(id);
  return { message: 'Article deleted successfully' };
}
