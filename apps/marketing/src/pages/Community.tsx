import { Layout } from "../components/layout/Layout.tsx";
import { Link } from "react-router";
import { Users, Briefcase, MessageSquare, ExternalLink, ThumbsUp, CheckCircle2, Vote, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/common/SEO.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.abs(now - then);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

type ForumTab = "forum" | "polls" | "elections" | null;

const Community = () => {
    const [activeTab, setActiveTab] = useState<ForumTab>(null);
    const [votedPolls, setVotedPolls] = useState<Record<number, number>>({});
    const [votedElections, setVotedElections] = useState<Record<string, number>>({});

    // API data
    const [mentors, setMentors] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [discussions, setDiscussions] = useState<any[]>([]);
    const [polls, setPolls] = useState<any[]>([]);
    const [elections, setElections] = useState<any[]>([]);

    useEffect(() => {
        // Fetch all community data from API
        Promise.allSettled([
            fetch(`${API_BASE}/mentorship/mentors`).then(r => r.json()),
            fetch(`${API_BASE}/jobs`).then(r => r.json()),
            fetch(`${API_BASE}/forum/posts`).then(r => r.json()),
            fetch(`${API_BASE}/polls`).then(r => r.json()),
            fetch(`${API_BASE}/elections`).then(r => r.json()),
        ]).then(([mentorRes, jobRes, forumRes, pollRes, electionRes]) => {
            if (mentorRes.status === 'fulfilled') {
                const m = mentorRes.value.data || [];
                setMentors(m.map((x: any) => ({
                    name: x.fullName, field: (x.areaOfExpertise || []).join(', '), year: `Class of ${x.yearGroup || ''}`, available: x.isAvailableAsMentor,
                })));
            }
            if (jobRes.status === 'fulfilled') {
                const j = jobRes.value.data || [];
                setJobs(j.map((x: any) => ({
                    title: x.title, company: x.company, location: x.location, type: x.jobType?.replace('_', '-'),
                    posted: x.createdAt ? new Date(x.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
                    postedBy: x.postedBy?.fullName || 'UPOSA', url: x.externalUrl || (x.contactEmail ? `mailto:${x.contactEmail}` : '#'),
                })));
            }
            if (forumRes.status === 'fulfilled') {
                const f = forumRes.value.data || [];
                setDiscussions(f.map((x: any) => ({
                    id: x.id, title: x.title, author: x.author?.fullName || 'Alumni', year: '', replies: x._count?.comments || x.viewCount || 0,
                    lastActive: x.updatedAt ? timeAgo(x.updatedAt) : '',
                })));
            }
            if (pollRes.status === 'fulfilled') {
                const p = pollRes.value.data || [];
                setPolls(p.map((x: any) => {
                    const opts = (x.options || []).map((o: any) => ({ text: o.text || o, votes: o.votes || 0 }));
                    const total = opts.reduce((s: number, o: any) => s + (o.votes || 0), 0);
                    return { id: x.id, question: x.question, options: opts, totalVoters: total, endsIn: x.endsAt ? timeAgo(x.endsAt) : 'Open' };
                }));
            }
            if (electionRes.status === 'fulfilled') {
                const e = electionRes.value.data || [];
                setElections(e.map((x: any) => ({
                    position: x.position || x.title, candidates: (x.candidates || []).map((c: any) => c.name || c),
                    status: x.status === 'ACTIVE' ? 'Voting Open' : x.status, endsIn: x.endDate ? timeAgo(x.endDate) : '',
                })));
            }
        });
    }, []);
    const expandedRef = useRef<HTMLDivElement>(null);

    const toggleTab = (tab: ForumTab) => {
        const isOpening = activeTab !== tab;
        setActiveTab(prev => prev === tab ? null : tab);
        if (isOpening) {
            setTimeout(() => {
                expandedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 350);
        }
    };

    const votePoll = (pollId: number, optionIdx: number) => {
        if (votedPolls[pollId] !== undefined) return;
        setVotedPolls(prev => ({ ...prev, [pollId]: optionIdx }));
    };

    const voteElection = (position: string, candidateIdx: number) => {
        if (votedElections[position] !== undefined) return;
        setVotedElections(prev => ({ ...prev, [position]: candidateIdx }));
    };

    return (
        <Layout>
            <SEO title="Community" description="Join the UPOSA community - mentorship programs, job opportunities, alumni forums, polls, and elections for University Practice SHS alumni." canonicalPath="/community" />
            <HeroBanner icon={Users} title="Community" description="Connect, grow, and contribute. Access mentorship, job opportunities, and engage in community discussions." />

            {/* Mentorship */}
            <section id="mentorship" className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Users} title="Mentorship & Networking" description="Our mentorship program connects students and young graduates with experienced alumni professionals." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mentors.map((mentor) => (
                            <Card key={mentor.name}>
                                <CardAccent />
                                <CardBody>
                                    <div className="flex items-center gap-3">
                                        <div className="avatar placeholder">
                                            <div className="bg-primary text-primary-content w-12 rounded-full">
                                                <span>{mentor.name.split(" ").map((n: string) => n[0]).join("")}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-semibold">{mentor.name}</p>
                                            <p className="text-xs text-base-content/60">{mentor.year}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-base-300 my-3" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                            <Users size={16} />
                                        </div>
                                        <p className="text-sm text-base-content/70">{mentor.field}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className={`badge badge-sm ${mentor.available ? "badge-success" : "badge-ghost"}`}>
                                            {mentor.available ? "Available" : "Unavailable"}
                                        </span>
                                        {mentor.available && <button className="btn btn-xs bg-primary text-white hover:brightness-110 border-0">Connect</button>}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </StaggerChildren>
                    <ScrollReveal delay={0.3}>
                        <div className="mt-6 text-center">
                            <Link to="/membership" className="btn bg-secondary text-secondary-content hover:brightness-110 border-0 gap-2">
                                <Users size={16} /> Become a Mentor
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Jobs */}
            <section id="jobs" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Briefcase} title="Jobs & Opportunities" description="Alumni-posted job openings, internships, and professional opportunities for the UPOSA community." align="left" />
                    <div className="space-y-4">
                        {jobs.map((job, i) => (
                            <ScrollReveal key={job.title + job.company} delay={i * 0.08}>
                                <div className="bg-base-100 rounded-2xl border border-base-300/60 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Briefcase size={20} className="text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base">{job.title}</h3>
                                                <p className="text-sm text-base-content/60 mt-0.5">{job.company} &middot; {job.location}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/8 text-primary">{job.type}</span>
                                                    <span className="text-xs text-base-content/40">{job.posted}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-primary text-white hover:brightness-110 border-0 gap-1.5 shrink-0">
                                            Apply <ExternalLink size={13} />
                                        </a>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                        {jobs.length === 0 && (
                            <div className="text-center py-12 text-base-content/40">
                                <Briefcase size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No job listings yet</p>
                                <p className="text-sm mt-1">Check back soon for new opportunities!</p>
                            </div>
                        )}
                    </div>
                    <ScrollReveal delay={0.4}>
                        <div className="mt-8 text-center">
                            <Link to="/contact?subject=Post a Job Opportunity" className="btn bg-secondary text-secondary-content hover:brightness-110 border-0 gap-2">
                                <Briefcase size={16} /> Post a Job Opportunity
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Forum */}
            <section id="forum" className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={MessageSquare} title="Forum / Polls / Elections" description="Engage with the UPOSA community through discussions, participate in polls, and vote in elections." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-3 gap-6">
                        <div className={`rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${activeTab === "forum" ? "bg-primary text-primary-content shadow-lg border-primary" : "bg-base-100 shadow-sm hover:shadow-lg hover:-translate-y-1 border border-base-300"}`} onClick={() => toggleTab("forum")}>
                            <div className="p-6 text-center">
                                <div className={`${activeTab === "forum" ? "bg-primary-content/20 text-primary-content" : "bg-secondary/10 text-secondary"} rounded-xl p-2.5 mx-auto mb-2 w-fit`}>
                                    <MessageSquare size={28} />
                                </div>
                                <h3 className="font-semibold">Discussion Forum</h3>
                                <p className={`text-sm ${activeTab === "forum" ? "opacity-80" : "text-base-content/70"}`}>Share ideas, ask questions, and connect with fellow alumni on various topics.</p>
                                <button className={`btn btn-sm mt-3 ${activeTab === "forum" ? "btn-secondary" : "btn-primary"}`}>
                                    {activeTab === "forum" ? "Hide" : "Join Discussion"} <ChevronDown size={14} className={`transition-transform ${activeTab === "forum" ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>
                        <div className={`rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${activeTab === "polls" ? "bg-primary text-primary-content shadow-lg border-primary" : "bg-base-100 shadow-sm hover:shadow-lg hover:-translate-y-1 border border-base-300"}`} onClick={() => toggleTab("polls")}>
                            <div className="p-6 text-center">
                                <div className={`${activeTab === "polls" ? "bg-primary-content/20 text-primary-content" : "bg-secondary/10 text-secondary"} rounded-xl p-2.5 mx-auto mb-2 w-fit`}>
                                    <ThumbsUp size={28} />
                                </div>
                                <h3 className="font-semibold">Polls & Surveys</h3>
                                <p className={`text-sm ${activeTab === "polls" ? "opacity-80" : "text-base-content/70"}`}>Participate in polls to help shape the direction of UPOSA initiatives.</p>
                                <button className={`btn btn-sm mt-3 ${activeTab === "polls" ? "btn-secondary" : "btn-primary"}`}>
                                    {activeTab === "polls" ? "Hide" : "View Active Polls"} <ChevronDown size={14} className={`transition-transform ${activeTab === "polls" ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>
                        <div className={`rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${activeTab === "elections" ? "bg-primary text-primary-content shadow-lg border-primary" : "bg-base-100 shadow-sm hover:shadow-lg hover:-translate-y-1 border border-base-300"}`} onClick={() => toggleTab("elections")}>
                            <div className="p-6 text-center">
                                <div className={`${activeTab === "elections" ? "bg-primary-content/20 text-primary-content" : "bg-secondary/10 text-secondary"} rounded-xl p-2.5 mx-auto mb-2 w-fit`}>
                                    <Vote size={28} />
                                </div>
                                <h3 className="font-semibold">Elections</h3>
                                <p className={`text-sm ${activeTab === "elections" ? "opacity-80" : "text-base-content/70"}`}>Vote for executive positions and participate in the democratic process of UPOSA.</p>
                                <button className={`btn btn-sm mt-3 ${activeTab === "elections" ? "btn-secondary" : "btn-primary"}`}>
                                    {activeTab === "elections" ? "Hide" : "View Elections"} <ChevronDown size={14} className={`transition-transform ${activeTab === "elections" ? "rotate-180" : ""}`} />
                                </button>
                            </div>
                        </div>
                    </StaggerChildren>

                    {/* Expandable Content */}
                    <div ref={expandedRef} />
                    <AnimatePresence mode="wait">
                        {activeTab && (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="mt-8">
                                    {/* Discussion Forum */}
                                    {activeTab === "forum" && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xl font-bold">Recent Discussions</h3>
                                                <button className="btn btn-primary btn-sm">New Topic</button>
                                            </div>
                                            {discussions.map((d) => (
                                                <Card key={d.id} className="cursor-pointer">
                                                    <div className="py-4 px-5 flex flex-row items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 shrink-0">
                                                                <MessageSquare size={16} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-semibold text-sm sm:text-base truncate">{d.title}</h4>
                                                                <p className="text-xs text-base-content/60 mt-1">
                                                                    {d.author} ({d.year}) &middot; {d.lastActive}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-base-content/60 shrink-0">
                                                            <MessageSquare size={14} /> {d.replies}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {/* Polls */}
                                    {activeTab === "polls" && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold">Active Polls</h3>
                                            {polls.map((poll) => {
                                                const hasVoted = votedPolls[poll.id] !== undefined;
                                                return (
                                                    <Card key={poll.id} shape="notch">
                                                        <CardAccent />
                                                        <CardBody>
                                                            <h4 className="font-semibold">{poll.question}</h4>
                                                            <p className="text-xs text-base-content/60 mb-3">{poll.totalVoters} voters &middot; Ends in {poll.endsIn}</p>
                                                            <div className="space-y-2">
                                                                {poll.options.map((opt: any, idx: number) => {
                                                                    const adjustedVotes = opt.votes + (votedPolls[poll.id] === idx ? 1 : 0);
                                                                    const adjustedTotal = poll.totalVoters + (hasVoted ? 1 : 0);
                                                                    const pct = Math.round((adjustedVotes / adjustedTotal) * 100);
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            className={`w-full text-left rounded-lg border p-3 transition relative overflow-hidden ${
                                                                                hasVoted
                                                                                    ? votedPolls[poll.id] === idx
                                                                                        ? "border-primary bg-primary/10"
                                                                                        : "border-base-300"
                                                                                    : "border-base-300 hover:border-primary hover:bg-primary/5 cursor-pointer"
                                                                            }`}
                                                                            onClick={() => votePoll(poll.id, idx)}
                                                                            disabled={hasVoted}
                                                                        >
                                                                            {hasVoted && (
                                                                                <div
                                                                                    className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                                                                                    style={{ width: `${pct}%` }}
                                                                                />
                                                                            )}
                                                                            <div className="relative flex items-center justify-between">
                                                                                <span className="text-sm font-medium flex items-center gap-2">
                                                                                    {votedPolls[poll.id] === idx && <CheckCircle2 size={16} className="text-primary" />}
                                                                                    {opt.text}
                                                                                </span>
                                                                                {hasVoted && <span className="text-xs font-semibold text-base-content/70">{pct}%</span>}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Elections */}
                                    {activeTab === "elections" && (
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-bold">Current Elections</h3>
                                            {elections.map((election) => {
                                                const hasVoted = votedElections[election.position] !== undefined;
                                                return (
                                                    <Card key={election.position} shape="notch">
                                                        <CardAccent />
                                                        <CardBody>
                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                                <h4 className="font-semibold text-lg">{election.position}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`badge badge-sm ${election.status === "Voting Open" ? "badge-success" : "badge-warning"}`}>
                                                                        {election.status}
                                                                    </span>
                                                                    <span className="text-xs text-base-content/60">Ends in {election.endsIn}</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {election.candidates.map((candidate: any, idx: number) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`flex items-center justify-between p-3 rounded-lg border transition ${
                                                                            hasVoted && votedElections[election.position] === idx
                                                                                ? "border-primary bg-primary/10"
                                                                                : "border-base-300"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="avatar placeholder">
                                                                                <div className="bg-primary text-primary-content w-9 rounded-full text-sm">
                                                                                    <span>{candidate.charAt(candidate.indexOf(".") > -1 ? candidate.indexOf(".") + 2 : 0)}</span>
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-sm font-medium">{candidate}</span>
                                                                        </div>
                                                                        {election.status === "Voting Open" && (
                                                                            hasVoted ? (
                                                                                votedElections[election.position] === idx ? (
                                                                                    <span className="badge badge-primary badge-sm gap-1"><CheckCircle2 size={12} /> Voted</span>
                                                                                ) : null
                                                                            ) : (
                                                                                <button className="btn btn-primary btn-xs" onClick={() => voteElection(election.position, idx)}>
                                                                                    Vote
                                                                                </button>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {hasVoted && (
                                                                <p className="text-xs text-success mt-2 flex items-center gap-1">
                                                                    <CheckCircle2 size={14} /> Your vote has been recorded. Thank you for participating!
                                                                </p>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>
        </Layout>
    );
};

export default Community;
