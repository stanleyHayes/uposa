import { getRepos } from '../../repositories';

export async function listActiveSchoolLeaders() {
  const { schoolLeaders } = getRepos();
  return schoolLeaders.findMany({ isActive: true }, { sort: { order: 1 } });
}

export async function listAllSchoolLeaders() {
  const { schoolLeaders } = getRepos();
  return schoolLeaders.findMany({}, { sort: { order: 1 } });
}

export async function getSchoolLeaderById(id: string) {
  const { schoolLeaders } = getRepos();
  const leader = await schoolLeaders.findById(id);
  if (!leader) {
    throw Object.assign(new Error('School leader not found'), { statusCode: 404 });
  }
  return leader;
}

interface CreateSchoolLeaderInput {
  name: string;
  position: string;
  photoUrl?: string;
  order?: number;
  isActive?: boolean;
}

export async function createSchoolLeader(data: CreateSchoolLeaderInput) {
  const { schoolLeaders } = getRepos();
  return schoolLeaders.create({
    name: data.name,
    position: data.position,
    photoUrl: data.photoUrl || null,
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
  });
}

export async function updateSchoolLeader(id: string, data: Partial<CreateSchoolLeaderInput>) {
  const { schoolLeaders } = getRepos();
  const existing = await schoolLeaders.findById(id);
  if (!existing) {
    throw Object.assign(new Error('School leader not found'), { statusCode: 404 });
  }
  return schoolLeaders.updateById(id, data as Record<string, unknown>);
}

export async function deleteSchoolLeader(id: string) {
  const { schoolLeaders } = getRepos();
  const existing = await schoolLeaders.findById(id);
  if (!existing) {
    throw Object.assign(new Error('School leader not found'), { statusCode: 404 });
  }
  await schoolLeaders.deleteById(id);
  return { message: 'School leader deleted successfully' };
}
