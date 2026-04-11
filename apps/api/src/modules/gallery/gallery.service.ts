import { getRepos } from '../../repositories';

// ═══════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════

export async function listGalleryCategories() {
  const { galleryCategories, galleryItems } = getRepos();
  const cats = await galleryCategories.findMany({}, { sort: { order: 1, createdAt: -1 } });
  // Attach image count to each category
  const result = [];
  for (const cat of cats) {
    const imageCount = await galleryItems.count({ categoryId: cat.id });
    result.push({ ...cat, imageCount });
  }
  return result;
}

export async function getCategoryById(id: string) {
  const { galleryCategories } = getRepos();
  const cat = await galleryCategories.findById(id);
  if (!cat) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return cat;
}

export async function createGalleryCategory(data: {
  name: string;
  description?: string;
  coverImageUrl?: string;
}) {
  const { galleryCategories } = getRepos();
  const existing = await galleryCategories.findOne({ name: data.name });
  if (existing) throw Object.assign(new Error('Category already exists'), { statusCode: 409 });
  return galleryCategories.create({
    name: data.name,
    description: data.description || null,
    coverImageUrl: data.coverImageUrl || null,
    order: 0,
  });
}

export async function updateGalleryCategory(id: string, data: {
  name?: string;
  description?: string;
  coverImageUrl?: string;
  order?: number;
}) {
  const { galleryCategories } = getRepos();
  const existing = await galleryCategories.findById(id);
  if (!existing) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  return galleryCategories.updateById(id, data as Record<string, unknown>);
}

export async function deleteGalleryCategory(id: string) {
  const { galleryCategories, galleryItems } = getRepos();
  const existing = await galleryCategories.findById(id);
  if (!existing) throw Object.assign(new Error('Category not found'), { statusCode: 404 });
  // Remove category reference from items
  const items = await galleryItems.findMany({ categoryId: id });
  for (const item of items) {
    await galleryItems.updateById(item.id, { categoryId: null, category: null });
  }
  await galleryCategories.deleteById(id);
  return { message: 'Category deleted successfully' };
}

// ═══════════════════════════════════════════════════════════
//  GALLERY ITEMS
// ═══════════════════════════════════════════════════════════

export async function listGalleryItems(filter?: { category?: string; categoryId?: string }) {
  const { galleryItems } = getRepos();
  const query: Record<string, unknown> = {};
  if (filter?.category) query.category = filter.category;
  if (filter?.categoryId) query.categoryId = filter.categoryId;
  return galleryItems.findMany(query, { sort: { createdAt: -1 } });
}

export async function createGalleryItem(data: {
  title: string;
  caption?: string;
  description?: string;
  imageUrl: string;
  category?: string;
  categoryId?: string;
  createdById: string;
}) {
  const { galleryItems } = getRepos();
  return galleryItems.create(data);
}

export async function updateGalleryItem(id: string, data: {
  title?: string;
  caption?: string;
  description?: string;
}) {
  const { galleryItems } = getRepos();
  const item = await galleryItems.findById(id);
  if (!item) throw Object.assign(new Error('Gallery item not found'), { statusCode: 404 });
  return galleryItems.updateById(id, data);
}

export async function deleteGalleryItem(id: string) {
  const { galleryItems } = getRepos();
  const existing = await galleryItems.findById(id);
  if (!existing) throw Object.assign(new Error('Gallery item not found'), { statusCode: 404 });
  await galleryItems.deleteById(id);
  return { message: 'Gallery item deleted successfully' };
}

export async function deleteMultipleGalleryItems(ids: string[]) {
  const { galleryItems } = getRepos();
  let deleted = 0;
  for (const id of ids) {
    const existing = await galleryItems.findById(id);
    if (existing) {
      await galleryItems.deleteById(id);
      deleted++;
    }
  }
  return { message: `${deleted} gallery item(s) deleted successfully`, deleted };
}
