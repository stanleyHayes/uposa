import { Layout } from "../components/layout/Layout.tsx";
import { UserPlus, Search, CreditCard, User, Mail, Phone, GraduationCap, MapPin, Briefcase, CheckCircle2, Smartphone, Building2, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";
import { registerMember } from "../api/client.ts";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const Membership = () => {
    const { data, loading } = useSiteData();
    const [submitted, setSubmitted] = useState(false);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const regFormRef = useRef<HTMLFormElement>(null);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const dues = data.config.dues;
    const payment = data.config.payment;

    return (
        <Layout>
            {/* Hero */}
            <HeroBanner icon={UserPlus} title="Membership" description="Join the UPOSA community. Register as an alumnus, access the alumni directory, and manage your dues." />

            {/* Registration Form */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <SectionHeader icon={UserPlus} title="Alumni Registration" description="We collect alumni data to keep our community connected, facilitate networking, and plan events and initiatives that serve our members." align="left" />

                        <ScrollReveal delay={0.15}>
                            <AnimatePresence mode="wait">
                                {submitted ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="card bg-base-100 border border-base-300 shadow-lg overflow-hidden"
                                    >
                                        <div className="h-1.5 bg-gradient-to-r from-success to-success/60" />
                                        <div className="card-body items-center text-center py-12">
                                            <motion.div
                                                className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.2 }}
                                            >
                                                <CheckCircle2 className="w-10 h-10 text-success" />
                                            </motion.div>
                                            <h3 className="text-xl font-bold mb-2">Registration Successful!</h3>
                                            <div className="space-y-3 text-left max-w-sm mt-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                                                    <p className="text-sm text-base-content/70"><span className="font-semibold text-base-content">Check your email</span> — We've sent a verification link to your inbox. Click it to verify your account.</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                                                    <p className="text-sm text-base-content/70"><span className="font-semibold text-base-content">Admin review</span> — After verification, your membership will be reviewed and approved by the executive team.</p>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                                                    <p className="text-sm text-base-content/70"><span className="font-semibold text-base-content">You're in!</span> — Once approved, you'll receive an email and can log in to the alumni portal.</p>
                                                </div>
                                            </div>
                                            <button className="btn btn-ghost btn-sm mt-6" onClick={() => setSubmitted(false)}>
                                                Submit another registration
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form"
                                        initial={{ opacity: 1 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <div className="card bg-base-100 border border-base-300 shadow-lg overflow-hidden">
                                            <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
                                            <div className="card-body p-6 sm:p-8">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-300">
                                                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                                        <UserPlus className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">Registration Form</h3>
                                                        <p className="text-xs text-base-content/50">Fields marked with * are required</p>
                                                    </div>
                                                </div>

                                                <form ref={regFormRef} className="space-y-5" onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    setRegLoading(true);
                                                    setRegError('');
                                                    const fd = new FormData(e.currentTarget);
                                                    const password = fd.get('password') as string;
                                                    const confirmPassword = fd.get('confirmPassword') as string;
                                                    if (password !== confirmPassword) {
                                                        setRegError('Passwords do not match');
                                                        setRegLoading(false);
                                                        return;
                                                    }
                                                    const expertise = (fd.get('areaOfExpertise') as string || '').split(',').map(s => s.trim()).filter(Boolean);
                                                    const programmeMap: Record<string, string> = { 'General Science': 'SCIENCE', 'General Arts': 'GENERAL_ARTS', 'Business': 'BUSINESS', 'Visual Arts': 'VISUAL_ARTS', 'Home Economics': 'HOME_ECONOMICS' };
                                                    try {
                                                        await registerMember({
                                                            fullName: fd.get('fullName') as string,
                                                            email: fd.get('email') as string,
                                                            password,
                                                            mobileNumber: fd.get('mobileNumber') as string || undefined,
                                                            yearGroup: fd.get('yearGroup') ? Number(fd.get('yearGroup')) : undefined,
                                                            programme: programmeMap[fd.get('programme') as string] || undefined,
                                                            house: fd.get('house') as string || undefined,
                                                            city: fd.get('city') as string || undefined,
                                                            country: fd.get('country') as string || undefined,
                                                            occupation: fd.get('occupation') as string || undefined,
                                                            areaOfExpertise: expertise.length > 0 ? expertise : undefined,
                                                            willingToVolunteer: fd.get('volunteer') ? 'YES' : 'NO',
                                                            consentGiven: !!fd.get('consent'),
                                                        });
                                                        setSubmitted(true);
                                                        regFormRef.current?.reset();
                                                    } catch (err) {
                                                        setRegError(err instanceof Error ? err.message : 'Registration failed');
                                                    } finally {
                                                        setRegLoading(false);
                                                    }
                                                }}>
                                                    {/* Personal Info */}
                                                    <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Personal Information</p>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Full Name *</span></label>
                                                            <div className="relative">
                                                                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="fullName" type="text" placeholder="Enter your full name" className="input input-bordered w-full pl-10" required />
                                                            </div>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Email Address *</span></label>
                                                            <div className="relative">
                                                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="email" type="email" placeholder="you@example.com" className="input input-bordered w-full pl-10" required />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Phone Number *</span></label>
                                                            <div className="relative">
                                                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="mobileNumber" type="tel" placeholder="+233 XX XXX XXXX" className="input input-bordered w-full pl-10" required />
                                                            </div>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Year Group *</span></label>
                                                            <div className="relative">
                                                                <GraduationCap size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <select name="yearGroup" className="select select-bordered w-full pl-10" required defaultValue="">
                                                                    <option value="" disabled>Select year group</option>
                                                                    {Array.from({ length: new Date().getFullYear() - 1981 + 1 }, (_, i) => 1981 + i).map((year) => (
                                                                        <option key={year} value={year}>{year}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Password */}
                                                    <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider pt-2">Account Security</p>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Password *</span></label>
                                                            <div className="relative">
                                                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="input input-bordered w-full pl-10 pr-10" required minLength={8} />
                                                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content" onClick={() => setShowPassword(!showPassword)}>
                                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Confirm Password *</span></label>
                                                            <div className="relative">
                                                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="confirmPassword" type="password" placeholder="Repeat password" className="input input-bordered w-full pl-10" required minLength={8} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Academic */}
                                                    <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider pt-2">Academic & Location</p>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Programme</span></label>
                                                            <select name="programme" className="select select-bordered w-full" defaultValue="">
                                                                <option value="" disabled>Select your programme</option>
                                                                <option>General Science</option>
                                                                <option>General Arts</option>
                                                                <option>Business</option>
                                                                <option>Visual Arts</option>
                                                                <option>Home Economics</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">House</span></label>
                                                            <select name="house" className="select select-bordered w-full" defaultValue="">
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
                                                    <div className="grid sm:grid-cols-3 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Region</span></label>
                                                            <div className="relative">
                                                                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <select name="region" className="select select-bordered w-full pl-10" defaultValue="">
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
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">City</span></label>
                                                            <select name="city" className="select select-bordered w-full" defaultValue="">
                                                                <option value="" disabled>Select</option>
                                                                <option>Accra</option><option>Kumasi</option><option>Cape Coast</option><option>Takoradi</option>
                                                                <option>Tamale</option><option>Sunyani</option><option>Ho</option><option>Koforidua</option>
                                                                <option>Bolgatanga</option><option>Wa</option><option>Techiman</option><option>Obuasi</option>
                                                                <option>Tema</option><option>Tarkwa</option><option>Winneba</option><option>Other</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Country</span></label>
                                                            <input name="country" type="text" placeholder="Ghana" className="input input-bordered w-full" defaultValue="Ghana" />
                                                        </div>
                                                    </div>

                                                    {/* Professional */}
                                                    <p className="text-xs font-semibold text-base-content/40 uppercase tracking-wider pt-2">Professional</p>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Occupation</span></label>
                                                            <div className="relative">
                                                                <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/30" />
                                                                <input name="occupation" type="text" placeholder="Your occupation" className="input input-bordered w-full pl-10" />
                                                            </div>
                                                        </div>
                                                        <div className="form-control">
                                                            <label className="label pb-1"><span className="label-text font-medium text-sm">Area(s) of Expertise</span></label>
                                                            <input name="areaOfExpertise" type="text" placeholder="e.g., Engineering, Education" className="input input-bordered w-full" />
                                                        </div>
                                                    </div>

                                                    {/* Consent */}
                                                    <div className="bg-base-200/50 rounded-xl p-4 border border-base-300 mt-2 space-y-3">
                                                        <label className="cursor-pointer flex items-start gap-3">
                                                            <input name="volunteer" type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5" />
                                                            <span className="text-sm text-base-content/70">I am willing to volunteer for UPOSA activities.</span>
                                                        </label>
                                                        <label className="cursor-pointer flex items-start gap-3">
                                                            <input name="consent" type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5" required />
                                                            <span className="text-sm text-base-content/70">I consent to being contacted for association purposes. *</span>
                                                        </label>
                                                    </div>

                                                    {regError && <p className="text-error text-sm">{regError}</p>}

                                                    <button type="submit" className={`btn btn-primary w-full h-12 text-base gap-2 ${regLoading ? 'loading' : ''}`} disabled={regLoading}>
                                                        {regLoading ? 'Submitting...' : <><UserPlus size={18} /> Submit Registration</>}
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </ScrollReveal>
                    </div>
                </div>
            </section>

            {/* Alumni Directory */}
            <section id="directory" className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Search} title="Alumni Directory" description="Search and connect with fellow alumni. The directory is available to registered members through the alumni portal." align="left" />
                    <ScrollReveal delay={0.15}>
                        <Card className="max-w-xl">
                            <CardAccent />
                            <CardBody>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                        <Search size={20} />
                                    </div>
                                    <h3 className="font-semibold">Find Fellow Alumni</h3>
                                </div>
                                <p className="text-sm text-base-content/70 mb-4">
                                    Our directory lets you search by name, year group, programme, and location. Register as a member to access the full directory through the alumni portal.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <a href="#registration" className="btn btn-primary btn-sm">Register Now</a>
                                    <a href={import.meta.env.VITE_ALUMNI_URL || 'http://localhost:5174'} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">Sign In to Portal</a>
                                </div>
                            </CardBody>
                        </Card>
                    </ScrollReveal>
                </div>
            </section>

            {/* Dues & Payments */}
            <section id="dues" className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={CreditCard} title="Dues & Payments" description="Annual membership dues help fund our projects and activities. Stay current with your dues to enjoy full membership benefits." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
                        <Card shape="notch" className="h-full">
                            <CardAccent />
                            <CardBody className="text-center flex flex-col justify-between">
                                <div>
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 mx-auto mb-3 w-fit">
                                        <CreditCard size={24} />
                                    </div>
                                    <h3 className="font-semibold text-lg">Annual Dues</h3>
                                    <p className="text-3xl font-bold text-primary my-2">{dues.currency} {dues.annual.toLocaleString()}</p>
                                    <p className="text-sm text-base-content/60">Standard membership fee per year</p>
                                </div>
                                <a href="/donate" className="btn btn-primary btn-sm mt-4">Pay Now</a>
                            </CardBody>
                        </Card>
                        <Card shape="notch" className="h-full">
                            <CardAccent />
                            <CardBody className="text-center flex flex-col justify-between">
                                <div>
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 mx-auto mb-3 w-fit">
                                        <CreditCard size={24} />
                                    </div>
                                    <h3 className="font-semibold text-lg">Lifetime Membership</h3>
                                    <p className="text-3xl font-bold text-primary my-2">{dues.currency} {dues.lifetime.toLocaleString()}</p>
                                    <p className="text-sm text-base-content/60">One-time payment, lifetime access</p>
                                </div>
                                <a href="/donate" className="btn btn-primary btn-sm mt-4">Pay Now</a>
                            </CardBody>
                        </Card>
                        <Card shape="notch" className="h-full">
                            <CardAccent />
                            <CardBody className="flex flex-col h-full">
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5 mx-auto mb-3 w-fit">
                                    <CreditCard size={24} />
                                </div>
                                <h3 className="font-semibold text-lg text-center mb-4">Payment Methods</h3>
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                                        <div className="w-9 h-9 rounded-lg bg-primary text-primary-content flex items-center justify-center shrink-0">
                                            <Smartphone size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">Mobile Money</p>
                                            <p className="text-xs text-base-content/50 truncate">{payment.momo.accountName} &middot; {payment.momo.number}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                                        <div className="w-9 h-9 rounded-lg bg-primary text-primary-content flex items-center justify-center shrink-0">
                                            <Building2 size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">Bank Transfer</p>
                                            <p className="text-xs text-base-content/50 truncate">{payment.bank.bank} &middot; {payment.bank.accountNo}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/60 border border-base-300/40">
                                        <div className="w-9 h-9 rounded-lg bg-secondary text-secondary-content flex items-center justify-center shrink-0">
                                            <Globe size={16} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold">Online Payment</p>
                                            <p className="text-xs text-base-content/50">Card, PayPal & more</p>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </StaggerChildren>
                </div>
            </section>
        </Layout>
    );
};

export default Membership;
