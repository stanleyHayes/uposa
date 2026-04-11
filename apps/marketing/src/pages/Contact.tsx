import { Layout } from "../components/layout/Layout.tsx";
import { Mail, Phone, MapPin, Send, FileText, Clock, ArrowRight, CheckCircle2, MessageCircle, Sparkles, Globe, Users } from "lucide-react";
import { useState, useRef } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import { submitContact, submitTranscriptRequest, subscribeNewsletter } from "../api/client.ts";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const Contact = () => {
    const { data, loading } = useSiteData();
    const [searchParams] = useSearchParams();
    const [contactSent, setContactSent] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactError, setContactError] = useState('');
    const [transcriptSent, setTranscriptSent] = useState(false);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const [transcriptError, setTranscriptError] = useState('');
    const [newsletterDone, setNewsletterDone] = useState(false);
    const [newsletterLoading, setNewsletterLoading] = useState(false);
    const contactFormRef = useRef<HTMLFormElement>(null);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const contact = data.config.contact;

    return (
        <Layout>
            <HeroBanner icon={Mail} title="Contact Us" description="Have a question, suggestion, or need help? We'd love to hear from you." />

            {/* Contact Info Strip */}
            <section className="relative -mt-8 z-10 pb-4">
                <div className="max-w-5xl mx-auto px-4">
                    <motion.div
                        className="bg-base-100 rounded-2xl shadow-xl border border-base-300/60 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="h-1 bg-gradient-to-r from-primary via-accent/80 to-secondary/60" />
                        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-base-300/50">
                            {[
                                { icon: Mail, label: "Email", value: contact.emails.general || "info@uposa.org", href: `mailto:${contact.emails.general || "info@uposa.org"}`, color: "from-primary/10 to-accent/5" },
                                { icon: Phone, label: "Phone", value: contact.phones.join(" / "), href: `tel:${contact.phones[0]?.replace(/\s/g, '')}`, color: "from-secondary/10 to-secondary/5" },
                                { icon: MapPin, label: "Location", value: contact.address, href: undefined, color: "from-accent/10 to-primary/5" },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    className="flex items-center gap-3.5 p-5 group"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                >
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                        <item.icon size={18} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-base-content/40 font-medium uppercase tracking-wider">{item.label}</p>
                                        {item.href ? (
                                            <a href={item.href} className="text-sm font-semibold truncate block hover:text-primary transition-colors">{item.value}</a>
                                        ) : (
                                            <p className="text-sm font-semibold truncate">{item.value}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Contact Form + Sidebar */}
            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid lg:grid-cols-5 gap-10">
                        {/* Form */}
                        <div className="lg:col-span-3">
                            <ScrollReveal>
                                <div className="flex items-center gap-2.5 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center">
                                        <MessageCircle size={18} className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Send us a message</h2>
                                        <p className="text-base-content/50 text-sm">We'll get back to you within 24 hours.</p>
                                    </div>
                                </div>
                            </ScrollReveal>

                            <AnimatePresence mode="wait">
                                {contactSent ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <Card hover={false}>
                                            <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/3 pointer-events-none rounded-[20px_4px_20px_4px]" />
                                            <CardBody className="text-center py-12 relative">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                                    className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                                                >
                                                    <CheckCircle2 size={40} className="text-success" />
                                                </motion.div>
                                                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                                                <p className="text-base-content/60 text-sm max-w-sm mx-auto">We'll get back to you as soon as possible.</p>
                                                <button className="btn btn-ghost btn-sm mt-4" onClick={() => setContactSent(false)}>Send another</button>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                ) : (
                                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <Card hover={false}>
                                            <CardAccent />
                                            <CardBody>
                                                <form ref={contactFormRef} className="space-y-4" onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    setContactLoading(true);
                                                    setContactError('');
                                                    const fd = new FormData(e.currentTarget);
                                                    try {
                                                        await submitContact({
                                                            name: fd.get('name') as string,
                                                            email: fd.get('email') as string,
                                                            subject: fd.get('subject') as string || 'General Inquiry',
                                                            message: fd.get('message') as string,
                                                        });
                                                        setContactSent(true);
                                                        contactFormRef.current?.reset();
                                                    } catch (err) {
                                                        setContactError(err instanceof Error ? err.message : 'Failed to send message');
                                                    } finally {
                                                        setContactLoading(false);
                                                    }
                                                }}>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label"><span className="label-text font-medium text-sm">Full Name *</span></label>
                                                            <input name="name" type="text" placeholder="Your name" className="input input-bordered" required />
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label"><span className="label-text font-medium text-sm">Email *</span></label>
                                                            <input name="email" type="email" placeholder="you@example.com" className="input input-bordered" required />
                                                        </div>
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text font-medium text-sm">Subject</span></label>
                                                        <input name="subject" type="text" placeholder="What is this about?" className="input input-bordered" defaultValue={searchParams.get("subject") || ""} />
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text font-medium text-sm">Message *</span></label>
                                                        <textarea name="message" className="textarea textarea-bordered h-32" placeholder="Tell us what's on your mind..." required></textarea>
                                                    </div>
                                                    {contactError && <p className="text-error text-sm">{contactError}</p>}
                                                    <button type="submit" className={`btn btn-primary gap-2 ${contactLoading ? 'loading' : ''}`} disabled={contactLoading}>
                                                        {contactLoading ? 'Sending...' : <>Send Message <Send size={16} /></>}
                                                    </button>
                                                </form>
                                            </CardBody>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* Office Hours */}
                            <ScrollReveal delay={0.1}>
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/3 border border-primary/10 p-6">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-[40px] pointer-events-none" />
                                    <div className="flex items-center gap-2.5 mb-3 relative">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Clock size={14} className="text-primary" />
                                        </div>
                                        <h3 className="font-bold text-sm">Office Hours</h3>
                                    </div>
                                    <p className="text-sm text-base-content/60 leading-relaxed relative">{contact.officeHours}</p>
                                </div>
                            </ScrollReveal>

                            {/* Quick Contacts */}
                            <ScrollReveal delay={0.2}>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Sparkles size={13} className="text-secondary" />
                                        <h3 className="font-bold text-sm">Quick Contacts</h3>
                                    </div>
                                    {Object.entries(contact.emails).map(([key, email]) => (
                                        <a
                                            key={key}
                                            href={`mailto:${email}`}
                                            className="flex items-center gap-3 p-3.5 rounded-xl bg-base-100 border border-base-300/50 hover:border-primary/15 hover:shadow-[0_4px_16px_rgba(0,27,80,0.06)] transition-all duration-200 group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/8 to-accent/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Mail size={14} className="text-primary/70" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] text-base-content/35 capitalize font-medium">{key}</p>
                                                <p className="text-sm font-medium truncate">{email}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-base-content/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </a>
                                    ))}
                                    {contact.phones.map((phone, i) => (
                                        <a
                                            key={i}
                                            href={`tel:${phone.replace(/\s/g, '')}`}
                                            className="flex items-center gap-3 p-3.5 rounded-xl bg-base-100 border border-base-300/50 hover:border-primary/15 hover:shadow-[0_4px_16px_rgba(0,27,80,0.06)] transition-all duration-200 group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary/8 to-secondary/3 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Phone size={14} className="text-secondary/70" />
                                            </div>
                                            <p className="text-sm font-medium flex-1">{phone}</p>
                                            <ArrowRight size={14} className="text-base-content/20 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </ScrollReveal>

                            {/* Map */}
                            <ScrollReveal delay={0.3}>
                                <div className="rounded-2xl overflow-hidden border border-base-300/60 shadow-sm">
                                    <div className="h-0.5 bg-gradient-to-r from-primary/30 via-accent/20 to-transparent" />
                                    <iframe
                                        title="University Practice SHS Location"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.4!2d-0.1925!3d5.6505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9c7ebaeabe93%3A0x5765d0e0f05ef088!2sUniversity%20of%20Ghana!5e0!3m2!1sen!2sgh!4v1710000000000!5m2!1sen!2sgh"
                                        width="100%"
                                        height="200"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transcript Request */}
            <section id="transcripts" className="py-16 bg-base-200">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-10 items-start">
                        {/* Info */}
                        <ScrollReveal>
                            <div className="flex items-center gap-3.5 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center shadow-sm">
                                    <FileText size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Transcript Requests</h2>
                                    <p className="text-sm text-base-content/50">We help you get your academic records</p>
                                </div>
                            </div>

                            <p className="text-base-content/60 mb-8 leading-relaxed">
                                Need a copy of your academic transcript? Submit a request and UPOSA will coordinate with the school administration on your behalf.
                            </p>

                            <div className="space-y-5">
                                {[
                                    { step: "1", title: "Submit your request", desc: "Fill in your details and year group", icon: Send },
                                    { step: "2", title: "We coordinate", desc: "UPOSA liaises with the school office", icon: Users },
                                    { step: "3", title: "Receive your document", desc: "Get it via email or physical pickup", icon: Globe },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.step}
                                        className="flex items-start gap-4"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.15 }}
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
                                                <item.icon size={16} className="text-primary-content" />
                                            </div>
                                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-secondary text-secondary-content text-[10px] font-bold flex items-center justify-center shadow-sm">
                                                {item.step}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{item.title}</p>
                                            <p className="text-xs text-base-content/50 mt-0.5">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollReveal>

                        {/* Form */}
                        <ScrollReveal delay={0.2}>
                            <Card hover={false}>
                                <CardAccent color="accent" />
                                <CardBody>
                                    <AnimatePresence mode="wait">
                                        {transcriptSent ? (
                                            <motion.div
                                                key="success"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-center py-8"
                                            >
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                                    className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                                                >
                                                    <CheckCircle2 size={32} className="text-success" />
                                                </motion.div>
                                                <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
                                                <p className="text-base-content/60 text-sm">We'll be in touch regarding your transcript.</p>
                                                <button className="btn btn-ghost btn-sm mt-4" onClick={() => setTranscriptSent(false)}>Submit another</button>
                                            </motion.div>
                                        ) : (
                                            <motion.form
                                                key="form"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="space-y-4"
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    setTranscriptLoading(true);
                                                    setTranscriptError('');
                                                    const fd = new FormData(e.currentTarget);
                                                    try {
                                                        await submitTranscriptRequest({
                                                            fullName: fd.get('fullName') as string,
                                                            email: fd.get('email') as string,
                                                            phone: (fd.get('phone') as string) || undefined,
                                                            yearGroup: fd.get('yearGroup') as string,
                                                            notes: (fd.get('notes') as string) || undefined,
                                                        });
                                                        setTranscriptSent(true);
                                                    } catch (err) {
                                                        setTranscriptError(err instanceof Error ? err.message : 'Failed to submit request');
                                                    } finally {
                                                        setTranscriptLoading(false);
                                                    }
                                                }}
                                            >
                                                <h3 className="font-bold mb-1 flex items-center gap-2">
                                                    <FileText size={16} className="text-primary/60" />
                                                    Request Form
                                                </h3>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text font-medium text-sm">Full Name *</span></label>
                                                    <input name="fullName" type="text" placeholder="Your full name" className="input input-bordered" required />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text font-medium text-sm">Year Group *</span></label>
                                                        <input name="yearGroup" type="text" placeholder="e.g. 2010" className="input input-bordered" required />
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label"><span className="label-text font-medium text-sm">Phone</span></label>
                                                        <input name="phone" type="tel" placeholder="Your number" className="input input-bordered" />
                                                    </div>
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text font-medium text-sm">Email *</span></label>
                                                    <input name="email" type="email" placeholder="you@example.com" className="input input-bordered" required />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text font-medium text-sm">Additional Notes</span></label>
                                                    <textarea name="notes" className="textarea textarea-bordered" rows={3} placeholder="Any special instructions..."></textarea>
                                                </div>
                                                {transcriptError && <p className="text-error text-sm">{transcriptError}</p>}
                                                <button type="submit" className={`btn btn-primary w-full gap-2 ${transcriptLoading ? 'loading' : ''}`} disabled={transcriptLoading}>
                                                    {transcriptLoading ? 'Submitting...' : <>Submit Request <ArrowRight size={16} /></>}
                                                </button>
                                            </motion.form>
                                        )}
                                    </AnimatePresence>
                                </CardBody>
                            </Card>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-primary/3 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-secondary/3 rounded-full blur-3xl" />
                </div>
                <div className="max-w-3xl mx-auto px-4 text-center relative">
                    <ScrollReveal>
                        <motion.div
                            className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center mx-auto mb-4"
                            whileHover={{ rotate: 12, scale: 1.1 }}
                        >
                            <Mail size={20} className="text-secondary" />
                        </motion.div>
                        <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
                        <p className="text-base-content/50 text-sm mb-6">Subscribe to receive announcements, event invitations, and UPOSA news.</p>
                        {newsletterDone ? (
                            <p className="text-success font-medium text-sm">You're subscribed! We'll keep you posted.</p>
                        ) : (
                            <form className="flex gap-2 max-w-md mx-auto" onSubmit={async (e) => {
                                e.preventDefault();
                                setNewsletterLoading(true);
                                const fd = new FormData(e.currentTarget);
                                try {
                                    await subscribeNewsletter(fd.get('email') as string);
                                    setNewsletterDone(true);
                                } catch { /* silent */ } finally {
                                    setNewsletterLoading(false);
                                }
                            }}>
                                <input name="email" type="email" placeholder="Your email address" className="input input-bordered flex-1" required />
                                <button type="submit" className={`btn btn-primary ${newsletterLoading ? 'loading' : ''}`} disabled={newsletterLoading}>
                                    {newsletterLoading ? '...' : 'Subscribe'}
                                </button>
                            </form>
                        )}
                    </ScrollReveal>
                </div>
            </section>
        </Layout>
    );
};

export default Contact;
