import { ParallaxImg } from "../components/common/Parallax.tsx";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    BadgeCheck,
    Briefcase,
    Building2,
    CheckCircle2,
    CreditCard,
    Eye,
    EyeOff,
    FileCheck,
    Globe,
    GraduationCap,
    Lock,
    Mail,
    MapPin,
    Phone,
    Search,
    ShieldCheck,
    Smartphone,
    User,
    UserPlus,
    Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { registerMember } from "../api/client.ts";

const inputClass = "input input-bordered w-full border-primary/15 bg-base-100 focus:border-secondary";
const selectClass = "select select-bordered w-full border-primary/15 bg-base-100 focus:border-secondary";

const Membership = () => {
    const { data, loading } = useSiteData();
    const [submitted, setSubmitted] = useState(false);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const regFormRef = useRef<HTMLFormElement>(null);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const dues = data.config.dues;
    const payment = data.config.payment;
    const stats = data.config.stats;
    const alumniPortalUrl = import.meta.env.VITE_ALUMNI_URL || "http://localhost:5174";

    const heroStats = [
        { label: "Members", value: `${stats.members.toLocaleString()}+`, icon: Users },
        { label: "Active years", value: `${stats.years}+`, icon: GraduationCap },
        { label: "Annual dues", value: `${dues.currency} ${dues.annual.toLocaleString()}`, icon: CreditCard },
    ];

    const registrationSteps = [
        { title: "Submit details", description: "Share your identity, year group, contact, and professional profile.", icon: UserPlus },
        { title: "Verify email", description: "Use the email link to confirm the address attached to your account.", icon: Mail },
        { title: "Executive review", description: "The team reviews and approves membership access for the alumni portal.", icon: ShieldCheck },
    ];

    const membershipBenefits = [
        "Alumni directory access",
        "Dues and payment tracking",
        "Mentorship and volunteer calls",
        "Year-group coordination",
    ];

    const years = Array.from({ length: new Date().getFullYear() - 1981 + 1 }, (_, index) => 1981 + index);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRegLoading(true);
        setRegError("");

        const fd = new FormData(event.currentTarget);
        const password = fd.get("password") as string;
        const confirmPassword = fd.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setRegError("Passwords do not match");
            setRegLoading(false);
            return;
        }

        const expertise = ((fd.get("areaOfExpertise") as string) || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        const programmeMap: Record<string, string> = {
            "General Science": "SCIENCE",
            "General Arts": "GENERAL_ARTS",
            Business: "BUSINESS",
            "Visual Arts": "VISUAL_ARTS",
            "Home Economics": "HOME_ECONOMICS",
        };

        try {
            await registerMember({
                fullName: fd.get("fullName") as string,
                email: fd.get("email") as string,
                password,
                mobileNumber: (fd.get("mobileNumber") as string) || undefined,
                yearGroup: fd.get("yearGroup") ? Number(fd.get("yearGroup")) : undefined,
                programme: programmeMap[fd.get("programme") as string] || undefined,
                house: (fd.get("house") as string) || undefined,
                city: (fd.get("city") as string) || undefined,
                country: (fd.get("country") as string) || undefined,
                occupation: (fd.get("occupation") as string) || undefined,
                areaOfExpertise: expertise.length > 0 ? expertise : undefined,
                willingToVolunteer: fd.get("volunteer") ? "YES" : "NO",
                consentGiven: !!fd.get("consent"),
            });
            setSubmitted(true);
            regFormRef.current?.reset();
        } catch (err) {
            setRegError(err instanceof Error ? err.message : "Registration failed");
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <Layout>
            <SEO
                title="Membership"
                description="Register as a UPOSA member, access the alumni directory, and manage dues and payments."
                canonicalPath="/membership"
            />

            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--uposa-hero-grid) 1px, transparent 1px), linear-gradient(var(--uposa-hero-grid) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
                <ParallaxImg
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-8 h-[520px] w-[520px] object-contain opacity-[0.08] md:h-[680px] md:w-[680px]"
                />

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_420px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Membership desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Registration, dues, and access</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <BadgeCheck size={16} />
                                Old student identity
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                Become visible, reachable, and active in the UPOSA network.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Register your alumni profile, keep your details current, support dues, and unlock the community tools that keep year groups connected.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#registration" className="btn btn-primary btn-lg">
                                    Start registration <ArrowRight size={18} />
                                </a>
                                <a href="#dues" className="btn btn-secondary btn-lg">
                                    View dues
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Member file</p>
                                        <h2 className="mt-3 text-2xl font-bold">One profile for the alumni portal.</h2>
                                    </div>
                                    <UserPlus className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 space-y-3">
                                    {membershipBenefits.map((benefit) => (
                                        <div key={benefit} className="flex items-center gap-3 border border-primary-content/10 bg-primary-content/10 p-3">
                                            <CheckCircle2 size={18} className="text-secondary" />
                                            <p className="text-sm font-semibold text-primary-content/75">{benefit}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <StaggerChildren className="grid gap-3 md:grid-cols-3">
                        {heroStats.map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/55">{stat.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="registration" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[360px_1fr] lg:items-start">
                    <ScrollReveal>
                        <div className="border border-primary/10 bg-primary p-5 text-primary-content shadow-sm lg:sticky lg:top-28">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Registration</p>
                            <h2 className="text-4xl font-bold leading-tight">Your alumni record starts here.</h2>
                            <p className="mt-5 leading-relaxed text-primary-content/65">
                                The form creates the member profile used for directory access, volunteer matching, dues records, and association communication.
                            </p>

                            <div className="mt-8 space-y-4">
                                {registrationSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={step.title} className="border border-primary-content/10 bg-primary-content/10 p-4">
                                            <div className="mb-3 flex items-center gap-3">
                                                <div className="grid h-10 w-10 place-items-center bg-secondary text-secondary-content">
                                                    <Icon size={18} />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">
                                                    Step {String(index + 1).padStart(2, "0")}
                                                </p>
                                            </div>
                                            <h3 className="font-bold">{step.title}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-primary-content/65">{step.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.1}>
                        <AnimatePresence mode="wait">
                            {submitted ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -18 }}
                                    className="border border-success/20 bg-base-100 shadow-sm"
                                >
                                    <div className="h-2 bg-success" />
                                    <div className="p-8 text-center md:p-12">
                                        <motion.div
                                            className="mx-auto mb-6 grid h-20 w-20 place-items-center bg-success/10"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", delay: 0.15 }}
                                        >
                                            <CheckCircle2 className="h-10 w-10 text-success" />
                                        </motion.div>
                                        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-secondary">Registration submitted</p>
                                        <h3 className="text-3xl font-bold text-primary">Your profile is in the review queue.</h3>
                                        <div className="mx-auto mt-8 grid max-w-3xl gap-4 text-left md:grid-cols-3">
                                            {["Check your email", "Await review", "Access the portal"].map((title, index) => (
                                                <div key={title} className="border border-base-300 bg-base-200 p-4">
                                                    <div className="mb-4 flex h-8 w-8 items-center justify-center bg-primary text-sm font-bold text-primary-content">
                                                        {index + 1}
                                                    </div>
                                                    <h4 className="font-bold text-primary">{title}</h4>
                                                    <p className="mt-2 text-sm leading-relaxed text-base-content/60">
                                                        {index === 0 && "Use the verification link sent to your inbox."}
                                                        {index === 1 && "The executive team confirms your membership details."}
                                                        {index === 2 && "Approved members receive portal access by email."}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn btn-primary mt-8" onClick={() => setSubmitted(false)}>
                                            Submit another registration
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}>
                                    <div className="border border-primary/10 bg-base-100 shadow-sm">
                                        <div className="flex flex-col gap-4 border-b border-primary/10 p-6 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Alumni registration</p>
                                                <h3 className="mt-2 text-2xl font-bold text-primary">Member profile form</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/55">
                                                <FileCheck size={18} className="text-secondary" />
                                                Required fields marked *
                                            </div>
                                        </div>

                                        <form ref={regFormRef} className="space-y-7 p-6 md:p-8" onSubmit={handleSubmit}>
                                            <div>
                                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Personal information</p>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Full name *</span></label>
                                                        <div className="relative">
                                                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="fullName" type="text" placeholder="Enter your full name" className={`${inputClass} pl-10`} required />
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Email address *</span></label>
                                                        <div className="relative">
                                                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="email" type="email" placeholder="you@example.com" className={`${inputClass} pl-10`} required />
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Phone number *</span></label>
                                                        <div className="relative">
                                                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="mobileNumber" type="tel" placeholder="+233 XX XXX XXXX" className={`${inputClass} pl-10`} required />
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Year group *</span></label>
                                                        <div className="relative">
                                                            <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <select name="yearGroup" className={`${selectClass} pl-10`} required defaultValue="">
                                                                <option value="" disabled>Select year group</option>
                                                                {years.map((year) => (
                                                                    <option key={year} value={year}>{year}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Account security</p>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Password *</span></label>
                                                        <div className="relative">
                                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="password" type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className={`${inputClass} pl-10 pr-10`} required minLength={8} />
                                                            <button
                                                                type="button"
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 transition-colors hover:text-primary"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                            >
                                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Confirm password *</span></label>
                                                        <div className="relative">
                                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Repeat password" className={`${inputClass} pl-10 pr-10`} required minLength={8} />
                                                            <button
                                                                type="button"
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 transition-colors hover:text-primary"
                                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                            >
                                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Academic and location</p>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Programme</span></label>
                                                        <select name="programme" className={selectClass} defaultValue="">
                                                            <option value="" disabled>Select your programme</option>
                                                            <option>General Science</option>
                                                            <option>General Arts</option>
                                                            <option>Business</option>
                                                            <option>Visual Arts</option>
                                                            <option>Home Economics</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">House</span></label>
                                                        <select name="house" className={selectClass} defaultValue="">
                                                            <option value="" disabled>Select your house</option>
                                                            <option value="ACKAH">Ackah</option>
                                                            <option value="DENSU">Densu</option>
                                                            <option value="TANO">Tano</option>
                                                            <option value="NKRUMAH">Nkrumah</option>
                                                            <option value="PRA">Pra</option>
                                                            <option value="VOLTA">Volta</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Region</span></label>
                                                        <div className="relative">
                                                            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <select name="region" className={`${selectClass} pl-10`} defaultValue="">
                                                                <option value="" disabled>Select</option>
                                                                <option>Ahafo</option><option>Ashanti</option><option>Bono</option><option>Bono East</option>
                                                                <option>Central</option><option>Eastern</option><option>Greater Accra</option>
                                                                <option>North East</option><option>Northern</option><option>Oti</option>
                                                                <option>Savannah</option><option>Upper East</option><option>Upper West</option>
                                                                <option>Volta</option><option>Western</option><option>Western North</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">City</span></label>
                                                        <select name="city" className={selectClass} defaultValue="">
                                                            <option value="" disabled>Select</option>
                                                            <option>Accra</option><option>Kumasi</option><option>Cape Coast</option><option>Takoradi</option>
                                                            <option>Tamale</option><option>Sunyani</option><option>Ho</option><option>Koforidua</option>
                                                            <option>Bolgatanga</option><option>Wa</option><option>Techiman</option><option>Obuasi</option>
                                                            <option>Tema</option><option>Tarkwa</option><option>Winneba</option><option>Other</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Country</span></label>
                                                        <input name="country" type="text" placeholder="Ghana" className={inputClass} defaultValue="Ghana" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Professional profile</p>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Occupation</span></label>
                                                        <div className="relative">
                                                            <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary/35" />
                                                            <input name="occupation" type="text" placeholder="Your occupation" className={`${inputClass} pl-10`} />
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label pb-1"><span className="label-text font-semibold text-primary">Area(s) of expertise</span></label>
                                                        <input name="areaOfExpertise" type="text" placeholder="e.g. Engineering, Education" className={inputClass} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 border border-primary/10 bg-base-200 p-4">
                                                <label className="flex cursor-pointer items-start gap-3">
                                                    <input name="volunteer" type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5" />
                                                    <span className="text-sm leading-relaxed text-base-content/70">I am willing to volunteer for UPOSA activities.</span>
                                                </label>
                                                <label className="flex cursor-pointer items-start gap-3">
                                                    <input name="consent" type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5" required />
                                                    <span className="text-sm leading-relaxed text-base-content/70">I consent to being contacted for association purposes. *</span>
                                                </label>
                                            </div>

                                            {regError && <p className="border border-error/20 bg-error/10 p-3 text-sm font-semibold text-error">{regError}</p>}

                                            <button type="submit" className="btn btn-primary h-12 w-full gap-2 text-base" disabled={regLoading}>
                                                {regLoading ? (
                                                    <span className="flex items-center gap-1.5" aria-label="Submitting registration">
                                                        <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="h-2 w-2 rounded-full bg-current animate-bounce" />
                                                    </span>
                                                ) : (<><UserPlus size={18} /> Submit registration</>)}
                                            </button>
                                        </form>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </ScrollReveal>
                </div>
            </section>

            <section id="directory" className="bg-primary py-16 text-primary-content md:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_460px] lg:items-center">
                    <ScrollReveal>
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Alumni directory</p>
                            <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Find classmates, year groups, executives, and community contacts.</h2>
                            <p className="mt-5 max-w-2xl leading-relaxed text-primary-content/65">
                                Directory access belongs inside the alumni portal so member information stays useful, searchable, and protected.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                <a href="#registration" className="btn btn-secondary">
                                    Register first
                                </a>
                                <a href={alumniPortalUrl} target="_blank" rel="noopener noreferrer" className="btn border-primary-content/20 bg-primary-content/10 text-primary-content hover:bg-primary-content hover:text-primary">
                                    Sign in to portal <ArrowRight size={18} />
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                            <div className="mb-5 flex items-center gap-3 border border-primary-content/10 bg-primary p-4">
                                <Search className="text-secondary" size={22} />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">Directory preview</p>
                                    <p className="font-bold">Search by name, year, programme, or location</p>
                                </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {["Year group", "Programme", "City", "Expertise"].map((filter) => (
                                    <div key={filter} className="border border-primary-content/10 bg-primary p-4">
                                        <p className="text-xs uppercase tracking-[0.14em] text-primary-content/45">{filter}</p>
                                        <p className="mt-2 font-semibold text-primary-content/80">Member filter</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section id="dues" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Dues and payments</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">Membership dues keep the association moving.</h2>
                                <p className="mt-4 max-w-2xl leading-relaxed text-base-content/60">
                                    Annual and lifetime payments support association operations, alumni programs, events, and school-facing projects.
                                </p>
                            </div>
                            <CreditCard size={42} className="text-secondary" />
                        </div>
                    </ScrollReveal>

                    <StaggerChildren className="grid gap-5 lg:grid-cols-[1fr_1fr_1.2fr]">
                        <div className="border border-primary/10 bg-base-200 p-6 shadow-sm">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                    <CreditCard size={23} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Per year</p>
                            </div>
                            <h3 className="text-2xl font-bold text-primary">Annual dues</h3>
                            <p className="mt-4 text-4xl font-bold text-primary">{dues.currency} {dues.annual.toLocaleString()}</p>
                            <p className="mt-3 leading-relaxed text-base-content/60">Standard yearly membership contribution.</p>
                            <Link to="/donate" className="btn btn-primary mt-8 w-full">
                                Pay annual dues
                            </Link>
                        </div>

                        <div className="border border-primary/10 bg-primary p-6 text-primary-content shadow-sm">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                    <BadgeCheck size={23} />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">One time</p>
                            </div>
                            <h3 className="text-2xl font-bold">Lifetime membership</h3>
                            <p className="mt-4 text-4xl font-bold">{dues.currency} {dues.lifetime.toLocaleString()}</p>
                            <p className="mt-3 leading-relaxed text-primary-content/65">A one-time commitment for long-term membership support.</p>
                            <Link to="/donate" className="btn btn-secondary mt-8 w-full">
                                Pay lifetime dues
                            </Link>
                        </div>

                        <div className="border border-primary/10 bg-base-200 p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Payment channels</p>
                                    <h3 className="mt-2 text-2xl font-bold text-primary">Choose your route</h3>
                                </div>
                                <Smartphone className="text-secondary" size={32} />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 border border-primary/10 bg-base-100 p-4">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center bg-primary text-primary-content">
                                        <Smartphone size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-primary">Mobile Money</p>
                                        <p className="truncate text-sm text-base-content/55">{payment.momo.accountName} - {payment.momo.number}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border border-primary/10 bg-base-100 p-4">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center bg-primary text-primary-content">
                                        <Building2 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-primary">Bank transfer</p>
                                        <p className="truncate text-sm text-base-content/55">{payment.bank.bank} - {payment.bank.accountNo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border border-primary/10 bg-base-100 p-4">
                                    <div className="grid h-11 w-11 shrink-0 place-items-center bg-secondary text-secondary-content">
                                        <Globe size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-primary">Online payment</p>
                                        <p className="text-sm text-base-content/55">Card, PayPal, and supported digital channels.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </StaggerChildren>
                </div>
            </section>
        </Layout>
    );
};

export default Membership;
