import { getRepos } from '../../repositories';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

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

export async function listProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;
  const repos = getRepos();

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const [rawData, total] = await Promise.all([
    repos.projects.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.projects.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getOngoingProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const where = { status: 'ONGOING' };

  const [rawData, total] = await Promise.all([
    repos.projects.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.projects.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getCompletedProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const repos = getRepos();
  const where = { status: 'COMPLETED' };

  const [rawData, total] = await Promise.all([
    repos.projects.findMany(where, { sort: { createdAt: -1 }, skip, limit }),
    repos.projects.count(where),
  ]);

  const data = await attachCreatedByMany(rawData);
  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getProjectBySlug(slug: string) {
  const repos = getRepos();
  const project = await repos.projects.findOne({ slug });
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  const withAdmin = await attachCreatedBy(project);
  return withAdmin;
}

export async function createProject(adminId: string, data: CreateProjectInput, imageUrl?: string) {
  const repos = getRepos();
  const slug = generateUniqueSlug(data.title);
  const project = await repos.projects.create({
    title: data.title,
    slug,
    description: data.description,
    content: data.content || null,
    imageUrl: imageUrl || data.imageUrl || null,
    gallery: data.gallery || [],
    milestones: (data.milestones || []).map((m) => ({
      title: m.title,
      description: m.description || null,
      date: m.date ? new Date(m.date) : null,
      completed: m.completed || false,
    })),
    goalAmount: data.goalAmount || 0,
    raisedAmount: 0,
    status: data.status || 'ONGOING',
    isFeatured: data.isFeatured || false,
    startDate: data.startDate ? new Date(data.startDate) : null,
    endDate: data.endDate ? new Date(data.endDate) : null,
    createdById: adminId,
  });

  const withAdmin = await attachCreatedBy(project);
  return withAdmin;
}

export async function updateProject(id: string, data: UpdateProjectInput, imageUrl?: string) {
  const repos = getRepos();
  const project = await repos.projects.findById(id);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (imageUrl) updateData.imageUrl = imageUrl;
  else if (data.imageUrl) updateData.imageUrl = data.imageUrl;
  if (data.milestones) {
    updateData.milestones = data.milestones.map((m) => ({
      title: m.title,
      description: m.description || null,
      date: m.date ? new Date(m.date) : null,
      completed: m.completed || false,
    }));
  }

  const result = await repos.projects.updateById(id, updateData);
  const withAdmin = await attachCreatedBy(result!);
  return withAdmin;
}

export async function deleteProject(id: string) {
  const repos = getRepos();
  const project = await repos.projects.findById(id);
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  await repos.projects.deleteById(id);
  return { message: 'Project deleted successfully' };
}
