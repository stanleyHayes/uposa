import { Layout } from "../components/layout/Layout.tsx";
import StatusPill from "../components/common/StatusPill.tsx";
import { Link, useParams } from "react-router";
import {
  ArrowLeft, Clock, Calendar, Share2, Heart,
  CheckCircle2, Circle, Image as ImageIcon,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import MarkdownContent from "../components/common/MarkdownContent.tsx";
// SplashScreen removed — using inline skeleton
import { Card, CardBody } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/projects/${slug}`)
      .then((r: Response) => r.json())
      .then((j: any) => setProject(j.data || null))
      .catch(() => setProject(null))
      .finally(() => setPageLoading(false));
  }, [slug]);

  if (pageLoading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div></Layout>;
  }

  if (!project) {
    return (
      <Layout>
        <section className="bg-primary text-primary-content py-16">
          <div className="max-w-7xl mx-auto px-4">
            <HeroReveal>
              <h1 className="text-4xl font-bold mb-4">Not Found</h1>
              <p className="text-lg opacity-90">The project you're looking for doesn't exist.</p>
            </HeroReveal>
          </div>
        </section>
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <p className="text-base-content/70 mb-6">This page may have been moved or removed.</p>
            <Link to="/projects" className="btn btn-primary">
              <ArrowLeft size={16} /> Back to Projects
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const progress = project.goalAmount > 0 ? Math.round((project.raisedAmount / project.goalAmount) * 100) : 0;
  const allImages = [project.imageUrl, ...(project.gallery || [])].filter(Boolean) as string[];
  const milestones = project.milestones || [];
  const completedCount = milestones.filter((m: any) => m.completed).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Layout>
      <SEO
        title={project.title}
        description={project.description}
        canonicalPath={`/projects/${slug}`}
      />

      {/* Hero */}
      <section className="bg-primary text-primary-content py-16">
        <div className="max-w-7xl mx-auto px-4">
          <HeroReveal>
            <Link to="/projects" className="inline-flex items-center gap-1 text-sm opacity-80 hover:opacity-100 mb-4 transition">
              <ArrowLeft size={14} /> Back to Projects
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusPill status={project.status} />
              {project.isFeatured && <StatusPill status="FEATURED" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{project.title}</h1>
            <p className="text-lg opacity-80 max-w-2xl">{project.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm opacity-70 mt-4">
              {project.startDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> Started {formatDate(project.startDate)}
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-1">
                  <Clock size={14} /> Ends {formatDate(project.endDate)}
                </span>
              )}
            </div>
          </HeroReveal>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cover image */}
              {project.imageUrl && (
                <ScrollReveal>
                  <div
                    className="overflow-hidden rounded-2xl cursor-pointer"
                    onClick={() => setLightboxIdx(0)}
                  >
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-64 md:h-96 object-cover hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </ScrollReveal>
              )}

              {/* Markdown content */}
              {project.content && (
                <ScrollReveal delay={0.1}>
                  <MarkdownContent content={project.content} />
                </ScrollReveal>
              )}

              {/* Milestones */}
              {milestones.length > 0 && (
                <ScrollReveal delay={0.15}>
                  <Card hover={false}>
                    <CardBody>
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-xl">Milestones</h2>
                        <span className="text-sm text-base-content/50">{completedCount}/{milestones.length} completed</span>
                      </div>
                      <div className="relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-base-300" />
                        <div className="space-y-5">
                          {milestones.map((m: any, i: number) => (
                            <div key={i} className="flex gap-3.5 relative">
                              <div className="shrink-0 mt-0.5 z-10">
                                {m.completed ? (
                                  <CheckCircle2 className="w-6 h-6 text-success" />
                                ) : (
                                  <Circle className="w-6 h-6 text-base-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold ${m.completed ? '' : 'text-base-content/50'}`}>{m.title}</p>
                                {m.description && (
                                  <p className="text-sm text-base-content/60 mt-0.5">{m.description}</p>
                                )}
                                {m.date && (
                                  <p className="text-xs text-base-content/40 mt-1 flex items-center gap-1">
                                    <Calendar size={12} /> {formatDate(m.date)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </ScrollReveal>
              )}

              {/* Gallery */}
              {allImages.length > 1 && (
                <ScrollReveal delay={0.2}>
                  <Card hover={false}>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-secondary" />
                        <h2 className="font-bold text-xl">Gallery</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allImages.map((url, idx) => (
                          <div
                            key={idx}
                            className="overflow-hidden rounded-xl cursor-pointer group"
                            onClick={() => setLightboxIdx(idx)}
                          >
                            <img
                              src={url}
                              alt={`${project.title} - ${idx + 1}`}
                              className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                </ScrollReveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Funding */}
              <ScrollReveal>
                <Card hover={false}>
                  <CardBody>
                    <h3 className="font-bold mb-3">Funding Progress</h3>
                    {project.goalAmount > 0 ? (
                      <>
                        <div className="text-center mb-3">
                          <p className="text-3xl font-bold text-secondary">GH₵ {project.raisedAmount.toLocaleString()}</p>
                          <p className="text-sm text-base-content/60">raised of GH₵ {project.goalAmount.toLocaleString()}</p>
                        </div>
                        <div className="h-3 bg-base-300 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-gradient-to-r from-secondary to-secondary/70 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-center text-sm font-semibold text-secondary">{progress}% funded</p>
                      </>
                    ) : (
                      <p className="text-center text-base-content/60">Open for donations</p>
                    )}
                    <Link to="/donate" className="btn btn-primary w-full mt-4">
                      <Heart size={16} /> Support This Project
                    </Link>
                  </CardBody>
                </Card>
              </ScrollReveal>

              {/* Milestone sidebar progress */}
              {milestones.length > 0 && (
                <ScrollReveal delay={0.1}>
                  <Card hover={false}>
                    <CardBody>
                      <h3 className="font-semibold text-sm mb-2">Milestone Progress</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-base-300 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full transition-all duration-500"
                            style={{ width: `${(completedCount / milestones.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-base-content/60 font-medium shrink-0">
                          {completedCount}/{milestones.length}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </ScrollReveal>
              )}

              {/* Share */}
              <ScrollReveal delay={0.15}>
                <button
                  className="btn btn-outline w-full btn-sm"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: project.title, url: window.location.href });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                >
                  <Share2 size={14} /> Share Project
                </button>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIdx !== null && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-white"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={20} />
          </button>
          {allImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + allImages.length) % allImages.length); }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % allImages.length); }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <img
            src={allImages[lightboxIdx]}
            alt={`${project.title} - ${lightboxIdx + 1}`}
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white/60 text-sm">{lightboxIdx + 1} / {allImages.length}</p>
        </div>
      )}
    </Layout>
  );
};

export default ProjectDetail;
