import { getRepos } from '../../repositories';

// Get all site configs as a key-value map
export async function getAllSiteConfig() {
  const { siteConfig } = getRepos();
  const configs = await siteConfig.findMany({});
  const result: Record<string, any> = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}

// Get a single config by key
export async function getSiteConfigByKey(key: string) {
  const { siteConfig } = getRepos();
  const config = await siteConfig.findOne({ key });
  return config?.value ?? null;
}

// Upsert a config value (admin)
export async function upsertSiteConfig(key: string, value: any) {
  const { siteConfig } = getRepos();
  return siteConfig.upsert({ key }, { key, value });
}

// Get reps grouped by year
export async function getYearGroupRepsGrouped() {
  const { yearGroupReps } = getRepos();
  const reps = await yearGroupReps.findMany({}, { sort: { year: 1, order: 1 } });
  const grouped: Record<string, Array<{ name: string; contact?: string | null; email?: string | null }>> = {};
  for (const rep of reps) {
    if (!grouped[rep.year]) grouped[rep.year] = [];
    grouped[rep.year].push({ name: rep.name, contact: rep.contact, email: rep.email });
  }
  return grouped;
}

// CRUD for year group reps (admin)
export async function listAllYearGroupReps() {
  const { yearGroupReps } = getRepos();
  return yearGroupReps.findMany({}, { sort: { year: 1, order: 1 } });
}

export async function createYearGroupRep(data: { year: string; name: string; contact?: string; email?: string; order?: number }) {
  const { yearGroupReps } = getRepos();
  return yearGroupReps.create(data);
}

export async function updateYearGroupRep(id: string, data: { year?: string; name?: string; contact?: string; email?: string; order?: number }) {
  const { yearGroupReps } = getRepos();
  const updated = await yearGroupReps.updateById(id, data as Record<string, unknown>);
  if (!updated) throw Object.assign(new Error('Rep not found'), { statusCode: 404 });
  return updated;
}

export async function deleteYearGroupRep(id: string) {
  const { yearGroupReps } = getRepos();
  await yearGroupReps.deleteById(id);
}

// Get complete public site data (single endpoint for marketing site)
export async function getPublicSiteData() {
  const { executives, events, projects, news, galleryItems, schoolLeaders } = getRepos();

  const [configs, execList, repsGrouped, upcomingEvents, ongoingProjects, latestNews, gallery, leaders] = await Promise.all([
    getAllSiteConfig(),
    executives.findMany({ isActive: true }, { sort: { order: 1 } }),
    getYearGroupRepsGrouped(),
    events.findMany({ status: 'UPCOMING' }, { sort: { date: 1 }, limit: 5 }),
    projects.findMany({ status: 'ONGOING' }, { sort: { createdAt: -1 }, limit: 6 }),
    news.findMany({ isPublished: true }, { sort: { publishedAt: -1 }, limit: 6 }),
    galleryItems.findMany({}, { sort: { createdAt: -1 } }),
    schoolLeaders.findMany({ isActive: true }, { sort: { order: 1 } }),
  ]);

  return {
    config: configs,
    executives: execList,
    yearGroupReps: repsGrouped,
    upcomingEvents,
    ongoingProjects,
    latestNews,
    gallery,
    schoolLeaders: leaders,
  };
}
