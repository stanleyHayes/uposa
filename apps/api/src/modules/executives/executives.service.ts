import { getRepos } from '../../repositories';

export async function listActiveExecutives() {
  const { executives } = getRepos();
  return executives.findMany({ isActive: true }, { sort: { order: 1 } });
}

export async function listAllExecutives() {
  const { executives } = getRepos();
  return executives.findMany({}, { sort: { order: 1 } });
}

export async function getExecutiveById(id: string) {
  const { executives } = getRepos();
  const executive = await executives.findById(id);
  if (!executive) {
    throw Object.assign(new Error('Executive not found'), { statusCode: 404 });
  }
  return executive;
}

interface CreateExecutiveInput {
  name: string;
  position: string;
  classOf: string;
  email?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  order?: number;
  isActive?: boolean;
}

export async function createExecutive(data: CreateExecutiveInput) {
  const { executives } = getRepos();
  return executives.create({
    name: data.name,
    position: data.position,
    classOf: data.classOf,
    email: data.email || null,
    phone: data.phone || null,
    bio: data.bio || null,
    photoUrl: data.photoUrl || null,
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
  });
}

interface UpdateExecutiveInput {
  name?: string;
  position?: string;
  classOf?: string;
  email?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  order?: number;
  isActive?: boolean;
}

export async function updateExecutive(id: string, data: UpdateExecutiveInput) {
  const { executives } = getRepos();
  const existing = await executives.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Executive not found'), { statusCode: 404 });
  }

  const updated = await executives.updateById(id, data as Record<string, unknown>);
  return updated;
}

export async function deleteExecutive(id: string) {
  const { executives } = getRepos();
  const existing = await executives.findById(id);
  if (!existing) {
    throw Object.assign(new Error('Executive not found'), { statusCode: 404 });
  }
  await executives.deleteById(id);
  return { message: 'Executive deleted successfully' };
}
