import prisma from '../../config/db';
import { getPaginationParams, buildPaginationMeta } from '../../utils/pagination.utils';
import { generateUniqueSlug } from '../../utils/response.utils';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';

export async function listProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);
  const { status, search } = query;

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getOngoingProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'ONGOING' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.project.count({ where: { status: 'ONGOING' } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getCompletedProjects(query: Record<string, string | undefined>) {
  const { page, limit, skip } = getPaginationParams(query);

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where: { status: 'COMPLETED' },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, fullName: true } } },
    }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function getProjectBySlug(slug: string) {
  const project = await prisma.project.findUnique({
    where: { slug },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  return project;
}

export async function createProject(adminId: string, data: CreateProjectInput, imageUrl?: string) {
  const slug = generateUniqueSlug(data.title);
  return prisma.project.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      imageUrl: imageUrl || null,
      goalAmount: data.goalAmount || 0,
      status: data.status || 'ONGOING',
      isFeatured: data.isFeatured || false,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: adminId,
    },
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function updateProject(id: string, data: UpdateProjectInput, imageUrl?: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });

  const updateData: Record<string, unknown> = { ...data };
  if (data.startDate) updateData.startDate = new Date(data.startDate);
  if (data.endDate) updateData.endDate = new Date(data.endDate);
  if (imageUrl) updateData.imageUrl = imageUrl;

  return prisma.project.update({
    where: { id },
    data: updateData,
    include: { createdBy: { select: { id: true, fullName: true } } },
  });
}

export async function deleteProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
  await prisma.project.delete({ where: { id } });
  return { message: 'Project deleted successfully' };
}
