import { ParallaxImg } from "../components/common/Parallax.tsx";
import { useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    Globe,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    ShieldCheck,
    Users,
} from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { submitContact, submitTranscriptRequest, subscribeNewsletter } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { BouncingDots } from "../components/common/BouncingDots.tsx";

function formValue(formData: FormData, key: string) {
    return String(formData.get(key) || "").trim();
}

function SuccessPanel({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    action: React.ReactNode;
}) {
    return (
        <motion.div
            key="success"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative overflow-hidden border border-success/20 bg-success/5 p-8 text-center"
        >
            <span aria-hidden="true" className="absolute left-4 top-4 h-5 w-5 border-l-2 border-t-2 border-success/20" />
            <span aria-hidden="true" className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-success/20" />
            <motion.div
                initial={{ scale: 0.86 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18 }}
                className="mx-auto mb-5 grid h-20 w-20 place-items-center bg-success/10 text-success"
            >
                {icon}
            </motion.div>
            <h3 className="text-2xl font-bold text-primary">{title}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-base-content/60">{description}</p>
            <div className="mt-7">{action}</div>
        </motion.div>
    );
}

const Contact = () => {
    const { data, loading } = useSiteData();
    const [searchParams] = useSearchParams();
    const [contactSent, setContactSent] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactError, setContactError] = useState("");
    const [transcriptSent, setTranscriptSent] = useState(false);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptError, setTranscriptError] = useState("");
    const [newsletterDone, setNewsletterDone] = useState(false);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const [newsletterError, setNewsletterError] = useState("");
    const contactFormRef = useRef<HTMLFormElement>(null);
    const transcriptFormRef = useRef<HTMLFormElement>(null);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const contact = data.config.contact;
    const primaryEmail = contact.emails.general || "info@uposa.org";
    const primaryPhone = contact.phones[0] || "0244036676";
    const phones = contact.phones.length > 0 ? contact.phones : [primaryPhone];
    const emailEntries = Object.entries(contact.emails).filter(([, email]) => Boolean(email));

    const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setContactLoading(true);
        setContactError("");
        const formData = new FormData(event.currentTarget);

        try {
            await submitContact({
                name: formValue(formData, "name"),
                email: formValue(formData, "email"),
                subject: formValue(formData, "subject") || "General Inquiry",
                message: formValue(formData, "message"),
            });
            setContactSent(true);
            contactFormRef.current?.reset();
        } catch (err) {
            setContactError(err instanceof Error ? err.message : "Failed to send message");
        } finally {
            setContactLoading(false);
        }
    };

    const handleTranscriptSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setTranscriptLoading(true);
        setTranscriptError("");
        const formData = new FormData(event.currentTarget);

        try {
            await submitTranscriptRequest({
                fullName: formValue(formData, "fullName"),
                email: formValue(formData, "email"),
                phone: formValue(formData, "phone") || undefined,
                yearGroup: formValue(formData, "yearGroup"),
                notes: formValue(formData, "notes") || undefined,
            });
            setTranscriptSent(true);
            transcriptFormRef.current?.reset();
        } catch (err) {
            setTranscriptError(err instanceof Error ? err.message : "Failed to submit request");
        } finally {
            setTranscriptLoading(false);
        }
    };

    const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setNewsletterLoading(true);
        setNewsletterError("");
        const formData = new FormData(event.currentTarget);

        try {
            await subscribeNewsletter(formValue(formData, "email"));
            setNewsletterDone(true);
            event.currentTarget.reset();
        } catch (err) {
            setNewsletterError(err instanceof Error ? err.message : "Failed to subscribe");
        } finally {
            setNewsletterLoading(false);
        }
    };

    const contactCards = [
        {
            icon: Mail,
            label: "Email",
            value: primaryEmail,
            detail: "General enquiries and association support",
            href: `mailto:${primaryEmail}`,
        },
        {
            icon: Phone,
            label: "Phone",
            value: phones.join(" / "),
            detail: "Call the UPOSA desk during office hours",
            href: `tel:${primaryPhone.replace(/\s/g, "")}`,
        },
        {
            icon: MapPin,
            label: "Location",
            value: contact.address,
            detail: "University Practice SHS and alumni coordination",
            href: undefined,
        },
    ];

    const serviceSteps = [
        { title: "Submit your details", description: "Share your full name, year group, contact, and notes.", icon: Send },
        { title: "UPOSA coordinates", description: "The request is routed through the association desk.", icon: Users },
        { title: "Document follow-up", description: "You receive next steps for pickup or email delivery.", icon: Globe },
    ];

    return (
        <Layout>
            <SEO
                title="Contact"
                description="Reach the UPOSA desk for enquiries, transcript requests, alumni support, and association updates."
                canonicalPath="/contact"
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

                <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:py-24 lg:grid-cols-[1fr_430px] lg:items-center">
                    <HeroReveal>
                        <div className="max-w-4xl">
                            <div className="mb-8 inline-flex items-center gap-3 border border-primary/15 bg-base-200 px-4 py-2">
                                <img src="/logo.png" alt="UPOSA crest" className="h-10 w-10 bg-base-100 object-contain p-1" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Contact desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Messages, documents, and alumni support</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <MessageCircle size={16} />
                                We are listening
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                One front desk for every alumni request.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Ask a question, request transcript support, share an opportunity, or subscribe for association updates from the same UPOSA service desk.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                <a href="#message" className="btn btn-primary btn-lg">
                                    Send a message <ArrowRight size={18} />
                                </a>
                                <a href="#transcripts" className="btn btn-secondary btn-lg">
                                    Request transcript
                                </a>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Response desk</p>
                                        <h2 className="mt-3 text-2xl font-bold">Route the right request to the right association channel.</h2>
                                    </div>
                                    <ShieldCheck className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 grid gap-3">
                                    {[
                                        { label: "General messages", value: "Contact form", icon: MessageCircle },
                                        { label: "Document support", value: "Transcript path", icon: FileText },
                                        { label: "Association updates", value: "Newsletter", icon: Mail },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <a
                                                key={item.label}
                                                href={item.label === "Document support" ? "#transcripts" : item.label === "Association updates" ? "#newsletter" : "#message"}
                                                className="group flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4 transition hover:bg-primary-content/15"
                                            >
                                                <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                                    <Icon size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/45">{item.label}</p>
                                                    <p className="mt-1 font-bold">{item.value}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-primary-content/35 transition group-hover:text-secondary" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section className="bg-primary text-primary-content">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <StaggerChildren className="grid gap-3 md:grid-cols-3">
                        {contactCards.map((item) => {
                            const Icon = item.icon;
                            const content = (
                                <>
                                    <div className="grid h-12 w-12 shrink-0 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">{item.label}</p>
                                        <p className="mt-1 truncate text-lg font-bold">{item.value}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-primary-content/50">{item.detail}</p>
                                    </div>
                                </>
                            );

                            return item.href ? (
                                <a key={item.label} href={item.href} className="flex items-start gap-4 border border-primary-content/10 bg-primary-content/10 p-4 transition hover:bg-primary-content/15">
                                    {content}
                                </a>
                            ) : (
                                <div key={item.label} className="flex items-start gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    {content}
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section id="message" className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1fr_390px] lg:items-start">
                    <ScrollReveal>
                        <div>
                            <div className="mb-8">
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Send a message</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">
                                    Tell the UPOSA desk what you need.
                                </h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    Use this for enquiries, suggestions, member support, job or news submissions, and association matters.
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {contactSent ? (
                                    <SuccessPanel
                                        icon={<CheckCircle2 size={40} />}
                                        title="Message sent"
                                        description="Thanks for reaching out. The UPOSA desk will follow up through the contact details you shared."
                                        action={
                                            <button type="button" className="btn btn-primary" onClick={() => setContactSent(false)}>
                                                Send another message
                                            </button>
                                        }
                                    />
                                ) : (
                                    <motion.form
                                        key="contact-form"
                                        ref={contactFormRef}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        className="border border-base-300 bg-base-100 p-5 shadow-sm md:p-7"
                                        onSubmit={handleContactSubmit}
                                    >
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <label className="form-control">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Full name *</span>
                                                </span>
                                                <input name="name" type="text" placeholder="Your name" className="input input-bordered bg-base-200" required />
                                            </label>
                                            <label className="form-control">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Email *</span>
                                                </span>
                                                <input name="email" type="email" placeholder="you@example.com" className="input input-bordered bg-base-200" required />
                                            </label>
                                        </div>

                                        <label className="form-control mt-4">
                                            <span className="label pb-2">
                                                <span className="label-text text-sm font-bold text-primary">Subject</span>
                                            </span>
                                            <input
                                                name="subject"
                                                type="text"
                                                placeholder="What is this about?"
                                                className="input input-bordered bg-base-200"
                                                defaultValue={searchParams.get("subject") || ""}
                                            />
                                        </label>

                                        <label className="form-control mt-4">
                                            <span className="label pb-2">
                                                <span className="label-text text-sm font-bold text-primary">Message *</span>
                                            </span>
                                            <textarea
                                                name="message"
                                                className="textarea textarea-bordered min-h-40 bg-base-200"
                                                placeholder="Tell us what is on your mind..."
                                                required
                                            />
                                        </label>

                                        {contactError && <p className="mt-4 border border-error/20 bg-error/5 p-3 text-sm font-semibold text-error">{contactError}</p>}

                                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm leading-relaxed text-base-content/50">
                                                Messages are stored for association follow-up and internal response tracking.
                                            </p>
                                            <button type="submit" className="btn btn-primary shrink-0 gap-2" disabled={contactLoading}>
                                                {contactLoading ? <BouncingDots /> : <>Send message <Send size={16} /></>}
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </ScrollReveal>

                    <aside className="space-y-5">
                        <ScrollReveal direction="left">
                            <div className="border border-base-300 bg-base-100 p-5 shadow-sm">
                                <div className="mb-5 flex items-start gap-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Clock size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Office hours</p>
                                        <h3 className="mt-1 text-xl font-bold text-primary">When to expect a response</h3>
                                    </div>
                                </div>
                                <p className="leading-relaxed text-base-content/60">{contact.officeHours}</p>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal direction="left" delay={0.08}>
                            <div className="border border-base-300 bg-base-100 p-5 shadow-sm">
                                <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-secondary">Quick contacts</p>
                                <div className="space-y-3">
                                    {emailEntries.map(([key, email]) => (
                                        <a
                                            key={key}
                                            href={`mailto:${email}`}
                                            className="group flex items-center gap-3 border border-base-300 bg-base-200 p-3 transition hover:border-primary/20 hover:bg-base-100"
                                        >
                                            <div className="grid h-10 w-10 shrink-0 place-items-center bg-primary/5 text-primary">
                                                <Mail size={16} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-base-content/35">{key}</p>
                                                <p className="truncate text-sm font-bold text-primary">{email}</p>
                                            </div>
                                            <ArrowRight size={15} className="text-base-content/25 transition group-hover:translate-x-1 group-hover:text-secondary" />
                                        </a>
                                    ))}
                                    {phones.map((phone) => (
                                        <a
                                            key={phone}
                                            href={`tel:${phone.replace(/\s/g, "")}`}
                                            className="group flex items-center gap-3 border border-base-300 bg-base-200 p-3 transition hover:border-primary/20 hover:bg-base-100"
                                        >
                                            <div className="grid h-10 w-10 shrink-0 place-items-center bg-secondary/10 text-secondary">
                                                <Phone size={16} />
                                            </div>
                                            <p className="min-w-0 flex-1 truncate text-sm font-bold text-primary">{phone}</p>
                                            <ArrowRight size={15} className="text-base-content/25 transition group-hover:translate-x-1 group-hover:text-secondary" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal direction="left" delay={0.16}>
                            <div className="overflow-hidden border border-base-300 bg-base-100 shadow-sm">
                                <div className="border-b border-base-300 p-5">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Location</p>
                                    <h3 className="mt-1 text-xl font-bold text-primary">University Practice SHS</h3>
                                </div>
                                <iframe
                                    title="University Practice SHS Location"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.4!2d-0.1925!3d5.6505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9c7ebaeabe93%3A0x5765d0e0f05ef088!2sUniversity%20of%20Ghana!5e0!3m2!1sen!2sgh!4v1710000000000!5m2!1sen!2sgh"
                                    width="100%"
                                    height="260"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </ScrollReveal>
                    </aside>
                </div>
            </section>

            <section id="transcripts" className="bg-base-100 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="sticky top-24">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Transcript requests</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">
                                Start official document support through UPOSA.
                            </h2>
                            <p className="mt-5 leading-relaxed text-base-content/60">
                                Submit your details and the association will coordinate with the appropriate school office on your behalf.
                            </p>

                            <div className="mt-8 space-y-4">
                                {serviceSteps.map((step, index) => {
                                    const Icon = step.icon;
                                    return (
                                        <div key={step.title} className="grid grid-cols-[56px_1fr] gap-4">
                                            <div className="relative">
                                                <div className="grid h-12 w-12 place-items-center bg-primary text-primary-content">
                                                    <Icon size={19} />
                                                </div>
                                                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center bg-secondary text-[10px] font-bold text-secondary-content">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-primary">{step.title}</h3>
                                                <p className="mt-1 text-sm leading-relaxed text-base-content/55">{step.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={0.12}>
                        <div className="border border-base-300 bg-base-200 p-5 shadow-sm md:p-7">
                            <AnimatePresence mode="wait">
                                {transcriptSent ? (
                                    <SuccessPanel
                                        icon={<CheckCircle2 size={38} />}
                                        title="Transcript request submitted"
                                        description="We have received your request. The UPOSA desk will contact you about the next document steps."
                                        action={
                                            <button type="button" className="btn btn-primary" onClick={() => setTranscriptSent(false)}>
                                                Submit another request
                                            </button>
                                        }
                                    />
                                ) : (
                                    <motion.form
                                        key="transcript-form"
                                        ref={transcriptFormRef}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -12 }}
                                        className="bg-base-100 p-5 md:p-7"
                                        onSubmit={handleTranscriptSubmit}
                                    >
                                        <div className="mb-6 flex items-start gap-4">
                                            <div className="grid h-12 w-12 shrink-0 place-items-center bg-secondary text-secondary-content">
                                                <FileText size={22} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Request form</p>
                                                <h3 className="mt-1 text-2xl font-bold text-primary">Academic records support</h3>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            <label className="form-control md:col-span-2">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Full name *</span>
                                                </span>
                                                <input name="fullName" type="text" placeholder="Your full name" className="input input-bordered bg-base-200" required />
                                            </label>
                                            <label className="form-control">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Year group *</span>
                                                </span>
                                                <input name="yearGroup" type="text" placeholder="e.g. 2010" className="input input-bordered bg-base-200" required />
                                            </label>
                                            <label className="form-control">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Phone</span>
                                                </span>
                                                <input name="phone" type="tel" placeholder="Your number" className="input input-bordered bg-base-200" />
                                            </label>
                                            <label className="form-control md:col-span-2">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Email *</span>
                                                </span>
                                                <input name="email" type="email" placeholder="you@example.com" className="input input-bordered bg-base-200" required />
                                            </label>
                                            <label className="form-control md:col-span-2">
                                                <span className="label pb-2">
                                                    <span className="label-text text-sm font-bold text-primary">Additional notes</span>
                                                </span>
                                                <textarea name="notes" className="textarea textarea-bordered min-h-28 bg-base-200" placeholder="Any special instructions..." />
                                            </label>
                                        </div>

                                        {transcriptError && <p className="mt-4 border border-error/20 bg-error/5 p-3 text-sm font-semibold text-error">{transcriptError}</p>}

                                        <button type="submit" className="btn btn-primary mt-6 w-full gap-2" disabled={transcriptLoading}>
                                            {transcriptLoading ? <BouncingDots /> : <>Submit request <ArrowRight size={16} /></>}
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            <section id="newsletter" className="bg-primary text-primary-content">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <ScrollReveal>
                        <div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Stay updated</p>
                            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Get association updates in your inbox.</h2>
                            <p className="mt-5 max-w-2xl leading-relaxed text-primary-content/60">
                                Subscribe for announcements, event invitations, dues reminders, and UPOSA news.
                            </p>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary-content/10 bg-primary-content/10 p-5 md:p-6">
                            {newsletterDone ? (
                                <div className="flex items-center gap-4">
                                    <div className="grid h-14 w-14 shrink-0 place-items-center bg-secondary text-secondary-content">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">You are subscribed.</h3>
                                        <p className="mt-1 text-sm text-primary-content/55">We will keep you posted on the next UPOSA update.</p>
                                    </div>
                                </div>
                            ) : (
                                <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={handleNewsletterSubmit}>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Your email address"
                                        className="input input-bordered border-primary-content/10 bg-primary-content/10 text-primary-content placeholder:text-primary-content/40"
                                        required
                                    />
                                    <button type="submit" className="btn btn-secondary" disabled={newsletterLoading}>
                                        {newsletterLoading ? <BouncingDots /> : "Subscribe"}
                                    </button>
                                    {newsletterError && <p className="text-sm font-semibold text-error sm:col-span-2">{newsletterError}</p>}
                                </form>
                            )}
                        </div>
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default Contact;
