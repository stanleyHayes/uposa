import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  FolderKanban,
  FolderOpen,
  Heart,
  Image as ImageIcon,
  Share2,
  Target,
  X,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import MarkdownContent from "../components/common/MarkdownContent.tsx";
import { SkeletonBlock, SkeletonLines } from "../components/common/Skeleton.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

type ProjectMilestone = {
  title: string;
  description?: string | null;
  date?: string | null;
  completed: boolean;
};

type ProjectDetailItem = {
  title: string;
  slug?: string;
  description: string;
  content?: string | null;
  imageUrl?: string | null;
  gallery?: string[];
  milestones?: ProjectMilestone[];
  goalAmount: number;
  raisedAmount: number;
  status: string;
  isFeatured: boolean;
  startDate?: string | null;
  endDate?: string | null;
};

type ProjectDetailResponse = {
  data?: ProjectDetailItem | null;
};

function formatDate(date?: string | null, long = false) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    month: long ? "long" : "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(amount = 0) {
  return `GH₵ ${amount.toLocaleString()}`;
}

function formatStatus(status?: string | null) {
  if (!status) return "Project";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function progressFor(raisedAmount = 0, goalAmount = 0) {
  if (goalAmount <= 0) return 0;
  return Math.min(100, Math.round((raisedAmount / goalAmount) * 100));
}

function ProjectBadge({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex items-center border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
        tone === "dark"
          ? "border-primary-content/15 bg-primary-content/10 text-primary-content/75"
          : "border-primary/15 bg-base-100 text-primary/70"
      }`}
    >
      {children}
    </span>
  );
}

function ShareButton({ title, className = "" }: { title: string; className?: string }) {
  return (
    <button
      type="button"
      className={`btn ${className}`}
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href });
          return;
        }

        navigator.clipboard?.writeText(window.location.href);
      }}
    >
      <Share2 size={16} />
      Share
    </button>
  );
}

function ProjectImage({ src, title, className = "" }: { src?: string | null; title: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`relative grid place-items-center overflow-hidden bg-primary text-primary-content ${className}`}>
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage: "linear-gradient(90deg, #fff 1px, transparent 1px), linear-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <img src="/logo.png" alt="" aria-hidden="true" className="absolute -right-12 -top-12 h-64 w-64 object-contain opacity-[0.08]" />
        <div className="relative text-center">
          <FolderOpen size={42} className="mx-auto mb-4 text-secondary" />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-content/55">UPOSA project</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}

function FundingProgress({ project, dark = false }: { project: ProjectDetailItem; dark?: boolean }) {
  const progress = progressFor(project.raisedAmount, project.goalAmount);

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${dark ? "text-primary-content/45" : "text-base-content/45"}`}>
            Raised
          </p>
          <p className={`text-2xl font-bold ${dark ? "text-secondary" : "text-primary"}`}>{formatMoney(project.raisedAmount)}</p>
        </div>
        <p className={`text-sm font-bold ${dark ? "text-primary-content/70" : "text-base-content/55"}`}>{progress}%</p>
      </div>
      <div className={dark ? "h-2.5 overflow-hidden bg-primary-content/10" : "h-2.5 overflow-hidden bg-base-300"}>
        <div className="h-full bg-secondary transition-all duration-700" style={{ width: `${progress}%` }} />
      </div>
      <div className={`mt-3 flex items-center justify-between text-xs font-semibold ${dark ? "text-primary-content/45" : "text-base-content/45"}`}>
        <span>Current support</span>
        <span>{project.goalAmount > 0 ? `${formatMoney(project.goalAmount)} target` : "Open target"}</span>
      </div>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <Layout>
      <SEO title="Loading Project" canonicalPath="/projects" />
      <section className="relative overflow-hidden bg-primary text-primary-content">
        <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:py-24 lg:grid-cols-[1fr_380px]">
          <div>
            <SkeletonBlock className="mb-8 h-10 w-44 bg-primary-content/15" />
            <SkeletonBlock className="h-12 w-full max-w-3xl bg-primary-content/20 md:h-20" />
            <SkeletonBlock className="mt-4 h-12 w-3/4 bg-primary-content/15" />
            <SkeletonLines count={2} className="mt-8 text-primary-content" />
          </div>
          <div className="border border-primary-content/10 bg-primary-content/10 p-5">
            <SkeletonBlock className="h-5 w-36 bg-primary-content/20" />
            <SkeletonBlock className="mt-6 h-20 w-full bg-primary-content/15" />
            <SkeletonBlock className="mt-5 h-12 w-full bg-primary-content/15" />
          </div>
        </div>
      </section>
      <section className="bg-base-200 py-12 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_320px]">
          <div>
            <SkeletonBlock className="h-[360px] w-full bg-primary/10" />
            <div className="mt-8 border border-primary/10 bg-base-100 p-6">
              <SkeletonLines count={8} className="text-primary" />
            </div>
          </div>
          <SkeletonBlock className="h-72 w-full bg-primary/10" />
        </div>
      </section>
    </Layout>
  );
}

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data } = useSiteData();
  const [project, setProject] = useState<ProjectDetailItem | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const fallbackProject = useMemo(
    () => data?.ongoingProjects.find((item) => item.slug === slug) || null,
    [data, slug],
  );

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setPageLoading(true);

    fetch(`${API_BASE}/projects/${slug}`)
      .then((response) => response.json() as Promise<ProjectDetailResponse>)
      .then((json) => {
        if (!cancelled) setProject(json.data || fallbackProject);
      })
      .catch(() => {
        if (!cancelled) setProject(fallbackProject);
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackProject, slug]);

  if (pageLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <Layout>
        <SEO title="Project Not Found" canonicalPath="/projects" />
        <section className="relative overflow-hidden bg-base-100 text-primary">
          <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
          <div className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
            <HeroReveal>
              <FolderKanban size={44} className="mx-auto mb-5 text-secondary" />
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Project unavailable</p>
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">This project could not be found.</h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-base-content/60">
                The project may have been completed, unpublished, or moved into another support lane.
              </p>
              <Link to="/projects" className="btn btn-primary mt-8">
                <ArrowLeft size={16} />
                Back to projects
              </Link>
            </HeroReveal>
          </div>
        </section>
      </Layout>
    );
  }

  const progress = progressFor(project.raisedAmount, project.goalAmount);
  const allImages = [project.imageUrl, ...(project.gallery || [])].filter(Boolean) as string[];
  const milestones = project.milestones || [];
  const completedCount = milestones.filter((milestone) => milestone.completed).length;
  const startDate = formatDate(project.startDate, true);
  const endDate = formatDate(project.endDate, true);

  return (
    <Layout>
      <SEO
        title={project.title}
        description={project.description}
        canonicalPath={`/projects/${slug}`}
      />

      <section className="relative overflow-hidden bg-primary text-primary-content">
        <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-8 h-[520px] w-[520px] object-contain opacity-[0.05] md:h-[700px] md:w-[700px]"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
          <HeroReveal>
            <div>
              <Link to="/projects" className="mb-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-primary-content/60 transition hover:text-secondary">
                <ArrowLeft size={15} />
                Project portfolio
              </Link>

              <div className="mb-6 flex flex-wrap gap-2">
                <ProjectBadge tone="dark">{formatStatus(project.status)}</ProjectBadge>
                {project.isFeatured && <ProjectBadge tone="dark">Featured priority</ProjectBadge>}
              </div>

              <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                <FolderKanban size={16} />
                Alumni-backed initiative
              </p>
              <h1 className="max-w-5xl text-4xl font-bold leading-[0.98] md:text-6xl lg:text-7xl">
                {project.title}
              </h1>
              <p className="mt-7 max-w-3xl text-lg leading-relaxed text-primary-content/70 md:text-xl">
                {project.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-primary-content/60">
                {startDate && (
                  <span className="inline-flex items-center gap-2 border border-primary-content/10 bg-primary-content/10 px-4 py-2">
                    <Calendar size={16} className="text-secondary" />
                    Started {startDate}
                  </span>
                )}
                {endDate && (
                  <span className="inline-flex items-center gap-2 border border-primary-content/10 bg-primary-content/10 px-4 py-2">
                    <Clock size={16} className="text-secondary" />
                    Ends {endDate}
                  </span>
                )}
                {milestones.length > 0 && (
                  <span className="inline-flex items-center gap-2 border border-primary-content/10 bg-primary-content/10 px-4 py-2">
                    <CheckCircle2 size={16} className="text-secondary" />
                    {completedCount}/{milestones.length} milestones
                  </span>
                )}
              </div>
            </div>
          </HeroReveal>

          <ScrollReveal direction="left">
            <aside className="border border-primary-content/15 bg-primary-content/10 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Funding status</p>
                  <h2 className="mt-3 text-2xl font-bold leading-tight">Support the workstream with clear progress.</h2>
                </div>
                <Target className="text-secondary" size={34} />
              </div>

              <div className="mt-8 border border-primary-content/10 bg-primary-content/10 p-4">
                <FundingProgress project={project} dark />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                  <p className="text-3xl font-bold text-secondary">{progress}%</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/50">Funded</p>
                </div>
                <div className="border border-primary-content/10 bg-primary-content/10 p-4">
                  <p className="text-3xl font-bold">{milestones.length || "Open"}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/50">Milestones</p>
                </div>
              </div>

              <Link to="/donate" className="btn btn-secondary mt-5 w-full">
                <Heart size={16} />
                Support this project
              </Link>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-base-200 py-12 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-start">
          <div className="space-y-8">
            <ScrollReveal>
              <button
                type="button"
                className="block w-full overflow-hidden border border-primary/15 bg-primary text-left"
                onClick={() => allImages.length > 0 && setLightboxIdx(0)}
              >
                <ProjectImage src={project.imageUrl} title={project.title} className="h-[320px] w-full md:h-[480px]" />
              </button>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <article className="border border-primary/10 bg-base-100 p-6 shadow-sm md:p-10">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-primary/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Project brief</p>
                    <h2 className="mt-2 text-3xl font-bold leading-tight text-primary">What this initiative is moving.</h2>
                  </div>
                  <ProjectBadge>{formatStatus(project.status)}</ProjectBadge>
                </div>

                {project.content ? (
                  <MarkdownContent content={project.content} />
                ) : (
                  <p className="text-lg leading-relaxed text-base-content/65">{project.description}</p>
                )}
              </article>
            </ScrollReveal>

            {milestones.length > 0 && (
              <ScrollReveal delay={0.15}>
                <section className="border border-primary/10 bg-base-100 p-6 shadow-sm md:p-10">
                  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Delivery path</p>
                      <h2 className="mt-2 text-3xl font-bold leading-tight text-primary">Milestones without the table clutter.</h2>
                    </div>
                    <p className="text-sm font-bold text-base-content/50">{completedCount}/{milestones.length} complete</p>
                  </div>

                  <div className="relative border-l border-primary/15 pl-6">
                    <div className="space-y-5">
                      {milestones.map((milestone, index) => (
                        <div key={`${milestone.title}-${index}`} className="relative border border-primary/10 bg-base-200 p-5">
                          <span className="absolute -left-[31px] top-6 grid h-12 w-12 place-items-center border border-primary/15 bg-base-100 text-primary">
                            {milestone.completed ? (
                              <CheckCircle2 size={20} className="text-success" />
                            ) : (
                              <Circle size={20} className="text-base-content/35" />
                            )}
                          </span>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-primary">{milestone.title}</p>
                              {milestone.description && (
                                <p className="mt-2 text-sm leading-relaxed text-base-content/60">{milestone.description}</p>
                              )}
                            </div>
                            {milestone.date && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-base-content/45">
                                <Calendar size={13} />
                                {formatDate(milestone.date)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </ScrollReveal>
            )}

            {allImages.length > 1 && (
              <ScrollReveal delay={0.2}>
                <section className="border border-primary/10 bg-base-100 p-6 shadow-sm md:p-10">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Project gallery</p>
                      <h2 className="mt-2 text-3xl font-bold leading-tight text-primary">Visual record</h2>
                    </div>
                    <ImageIcon className="text-secondary" size={28} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {allImages.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        className="group overflow-hidden border border-primary/10 bg-primary text-left"
                        onClick={() => setLightboxIdx(index)}
                      >
                        <img
                          src={url}
                          alt={`${project.title} ${index + 1}`}
                          className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              </ScrollReveal>
            )}
          </div>

          <ScrollReveal delay={0.15}>
            <aside className="sticky top-28 space-y-5">
              <div className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Project facts</p>
                <dl className="mt-5 grid gap-3">
                  {[
                    ["Status", formatStatus(project.status)],
                    ["Started", startDate || "To be confirmed"],
                    ["Ends", endDate || "Open timeline"],
                    ["Raised", formatMoney(project.raisedAmount)],
                    ["Target", project.goalAmount > 0 ? formatMoney(project.goalAmount) : "Open"],
                  ].map(([label, value]) => (
                    <div key={label} className="border border-primary/10 bg-base-200 p-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-base-content/45">{label}</dt>
                      <dd className="mt-1 font-bold text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="border border-primary/10 bg-base-100 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Support lane</p>
                <p className="mt-3 text-sm leading-relaxed text-base-content/60">
                  Donations help move this project from progress updates to visible delivery.
                </p>
                <Link to="/donate" className="btn btn-primary mt-5 w-full">
                  Donate now
                  <ArrowRight size={16} />
                </Link>
                <ShareButton title={project.title} className="btn-outline mt-3 w-full border-primary/15 text-primary" />
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      {lightboxIdx !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            className="btn btn-ghost btn-sm absolute right-4 top-4 border border-white/20 text-white"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-sm absolute left-4 top-1/2 -translate-y-1/2 border border-white/20 text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length);
                }}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm absolute right-4 top-1/2 -translate-y-1/2 border border-white/20 text-white"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIdx((lightboxIdx + 1) % allImages.length);
                }}
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img
            src={allImages[lightboxIdx]}
            alt={`${project.title} ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-white/60">{lightboxIdx + 1} / {allImages.length}</p>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetail;
