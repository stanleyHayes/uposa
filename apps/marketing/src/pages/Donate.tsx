import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    Banknote,
    Bitcoin,
    Building2,
    CheckCircle2,
    Copy,
    CreditCard,
    Globe,
    Heart,
    Landmark,
    PieChart,
    ShieldCheck,
    Smartphone,
    Target,
    X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Layout } from "../components/layout/Layout.tsx";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import { HeroReveal } from "../components/common/HeroReveal.tsx";
import SEO from "../components/common/SEO.tsx";
import { useSiteData } from "../context/SiteDataContext.tsx";
import type { SiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { SkeletonBlock } from "../components/common/Skeleton.tsx";
import { getPlatformFeePreview } from "../api/client.ts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

interface PaymentMethodData {
    id: string;
    provider: string;
    displayName: string;
    description?: string;
    isEnabled: boolean;
    supportedCurrencies: string[];
    countries: string[];
}

interface ImpactStory {
    quote: string;
    name: string;
    year: string;
}

interface PlatformFeePreview {
    amount: number;
    platformFee: number;
    totalAmount: number;
    percent: number;
    fixed: number;
    enabled: boolean;
}

type SelectedMethod = "momo" | "bank" | string | null;
type DonationStep = "amount" | "payment" | "confirm" | "success";
type ConfigWithImpactStories = SiteData["config"] & { impactStories?: ImpactStory[] };

const defaultImpactStories: ImpactStory[] = [
    {
        quote: "Thanks to the UPOSA scholarship, I was able to complete my A-levels and gain admission to the University of Ghana. Today I am a practicing pharmacist.",
        name: "Samuel Mensah",
        year: "Class of 2018",
    },
    {
        quote: "The renovated library gave us access to resources that changed how we studied. Our WASSCE results improved significantly that year.",
        name: "Priscilla Adjei",
        year: "Class of 2020",
    },
];

const presetAmounts = [50, 100, 200, 500, 1000];
const heroAmounts = [50, 100, 500];

const providerIcons: Record<string, LucideIcon> = {
    PAYSTACK: CreditCard,
    STRIPE: CreditCard,
    CRYPTO: Bitcoin,
};

function formatMoney(currency: string, amount?: number | null) {
    if (!amount || Number.isNaN(amount)) return `${currency} 0`;
    return `${currency} ${amount.toLocaleString()}`;
}

function DetailRow({ label, value, action }: { label: string; value: ReactNode; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-base-300 py-3 last:border-0">
            <span className="text-sm font-semibold text-base-content/45">{label}</span>
            <span className="flex min-w-0 items-center gap-2 text-right text-sm font-bold text-primary">
                {value}
                {action}
            </span>
        </div>
    );
}

function StepMarker({ currentStep }: { currentStep: DonationStep }) {
    const steps: { id: DonationStep; label: string }[] = [
        { id: "amount", label: "Amount" },
        { id: "payment", label: "Method" },
        { id: "confirm", label: "Confirm" },
    ];
    const activeIndex = steps.findIndex((step) => step.id === currentStep);
    const success = currentStep === "success";

    return (
        <div className="grid grid-cols-3 gap-2">
            {steps.map((item, index) => {
                const active = success || index <= activeIndex;
                return (
                    <div key={item.id} className={`border p-3 ${active ? "border-secondary bg-secondary/10 text-primary" : "border-base-300 bg-base-200 text-base-content/45"}`}>
                        <p className="text-xs font-bold uppercase tracking-[0.14em]">{String(index + 1).padStart(2, "0")}</p>
                        <p className="mt-1 text-sm font-bold">{item.label}</p>
                    </div>
                );
            })}
        </div>
    );
}

const Donate = () => {
    const { data, loading } = useSiteData();
    const [onlinePaymentMethods, setOnlinePaymentMethods] = useState<PaymentMethodData[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<SelectedMethod>(null);
    const [step, setStep] = useState<DonationStep>("amount");
    const [copied, setCopied] = useState(false);
    const [initiating, setInitiating] = useState(false);
    const [donorEmail, setDonorEmail] = useState("");
    const [donorName, setDonorName] = useState("");
    const [feePreview, setFeePreview] = useState<PlatformFeePreview | null>(null);
    const [feeLoading, setFeeLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let cancelled = false;

        fetch(`${API_BASE}/payment-methods`)
            .then((response) => response.json())
            .then((json: { data?: PaymentMethodData[] }) => {
                if (!cancelled) {
                    setOnlinePaymentMethods(json.data?.filter((method) => method.isEnabled) || []);
                }
            })
            .catch(() => {
                if (!cancelled) setOnlinePaymentMethods([]);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const payment = data?.config.payment;
    const donationAllocation = data?.config.donationAllocation || [];
    const currency = data?.config.dues.currency || "GHS";
    const configWithImpactStories = data?.config as ConfigWithImpactStories | undefined;
    const impactStories = configWithImpactStories?.impactStories?.length ? configWithImpactStories.impactStories : defaultImpactStories;

    const openModal = (amount?: number) => {
        if (amount) {
            setSelectedAmount(amount);
            setCustomAmount("");
            setIsCustom(false);
            setStep("payment");
        } else {
            setSelectedAmount(null);
            setCustomAmount("");
            setIsCustom(true);
            setStep("amount");
        }
        setPaymentMethod(null);
        setCopied(false);
        setDonorEmail("");
        setDonorName("");
        setFeePreview(null);
        setModalOpen(true);
    };

    const finalAmount = isCustom ? Number(customAmount) : selectedAmount;
    const hasValidAmount = Boolean(finalAmount && finalAmount > 0);
    const isOnlineMethod = paymentMethod && !["momo", "bank"].includes(paymentMethod);
    const selectedOnlineMethod = onlinePaymentMethods.find((method) => method.provider === paymentMethod);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (!isOnlineMethod || !finalAmount || finalAmount <= 0) {
            setFeePreview(null);
            return;
        }

        setFeeLoading(true);
        getPlatformFeePreview(finalAmount)
            .then((preview: PlatformFeePreview) => setFeePreview(preview))
            .catch(() => setFeePreview(null))
            .finally(() => setFeeLoading(false));
    }, [isOnlineMethod, finalAmount]);

    const handleConfirm = async () => {
        if (isOnlineMethod && selectedOnlineMethod) {
            if (!donorEmail.trim()) return;
            setInitiating(true);

            try {
                const donationResponse = await fetch(`${API_BASE}/donations`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        donorName: donorName || "Anonymous",
                        donorEmail,
                        amount: finalAmount,
                        currency,
                        channel: selectedOnlineMethod.provider,
                        purpose: "General Donation",
                    }),
                });
                const donationJson = await donationResponse.json();
                const donationId = donationJson.data?.id;

                const paymentResponse = await fetch(`${API_BASE}/payments/initialize`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        provider: selectedOnlineMethod.provider,
                        purpose: "DONATION",
                        amount: finalAmount,
                        currency,
                        email: donorEmail,
                        name: donorName || undefined,
                        donationId,
                        callbackUrl: `${window.location.origin}/donate?status=success`,
                    }),
                });
                const paymentJson = await paymentResponse.json();

                if (paymentJson.data?.authorizationUrl) {
                    window.location.href = paymentJson.data.authorizationUrl;
                    return;
                }

                setStep("success");
            } catch {
                setStep("success");
            } finally {
                setInitiating(false);
            }
        } else {
            setStep("success");
        }
    };

    useEffect(() => {
        if (modalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [modalOpen]);

    if (loading || !data || !payment) {
        return <SplashScreen />;
    }

    const totalAllocation = donationAllocation.reduce((sum, item) => sum + item.percentage, 0);
    const paymentRails = [
        {
            id: "momo",
            title: "Mobile Money",
            subtitle: "MTN, Vodafone, or AirtelTigo",
            detail: payment.momo.number,
            meta: `MoMo Pay ID: ${payment.momo.payId}`,
            icon: Smartphone,
            action: () => {
                openModal();
                setPaymentMethod("momo");
                setStep("amount");
            },
        },
        {
            id: "bank",
            title: "Bank Transfer",
            subtitle: payment.bank.bank,
            detail: payment.bank.accountNo,
            meta: payment.bank.accountName,
            icon: Building2,
            action: () => {
                openModal();
                setPaymentMethod("bank");
                setStep("amount");
            },
        },
    ];

    return (
        <Layout>
            <SEO
                title="Donate"
                description="Support UPOSA projects, scholarships, school infrastructure, and student welfare through secure donations."
                canonicalPath="/donate"
            />

            <section className="relative overflow-hidden bg-base-100 text-primary">
                <div className="absolute inset-x-0 top-0 h-2 bg-secondary" />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: "linear-gradient(90deg, var(--uposa-hero-grid) 1px, transparent 1px), linear-gradient(var(--uposa-hero-grid) 1px, transparent 1px)",
                        backgroundSize: "44px 44px",
                    }}
                />
                <img
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
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Giving desk</p>
                                    <p className="text-sm font-semibold text-primary/70">Projects, welfare, and school support</p>
                                </div>
                            </div>

                            <p className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.24em] text-secondary">
                                <Heart size={16} />
                                Alumni giving
                            </p>
                            <h1 className="max-w-5xl text-5xl font-bold leading-[0.98] md:text-7xl">
                                Make every cedi visible in the school story.
                            </h1>
                            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-base-content/65 md:text-xl">
                                Support scholarships, infrastructure, NSMQ preparation, student welfare, and association-led projects for University Practice SHS.
                            </p>

                            <div className="mt-9 flex flex-wrap gap-3">
                                {heroAmounts.map((amount) => (
                                    <button key={amount} type="button" className="btn btn-primary btn-lg" onClick={() => openModal(amount)}>
                                        Give {formatMoney(currency, amount)}
                                    </button>
                                ))}
                                <button type="button" className="btn btn-secondary btn-lg" onClick={() => openModal()}>
                                    Custom amount
                                </button>
                            </div>
                        </div>
                    </HeroReveal>

                    <ScrollReveal direction="left">
                        <div className="border border-primary/15 bg-primary p-4 text-primary-content shadow-2xl">
                            <div className="border border-primary-content/10 bg-primary-content/10 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Giving routes</p>
                                        <h2 className="mt-3 text-2xl font-bold">Pick an amount, choose a rail, and complete securely.</h2>
                                    </div>
                                    <ShieldCheck className="text-secondary" size={34} />
                                </div>

                                <div className="mt-8 grid gap-3">
                                    {[
                                        { label: "Manual rails", value: "MoMo and bank", icon: Banknote },
                                        { label: "Online rails", value: onlinePaymentMethods.length > 0 ? `${onlinePaymentMethods.length} enabled` : "Available soon", icon: CreditCard },
                                        { label: "Allocation map", value: `${totalAllocation}% assigned`, icon: PieChart },
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                                <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-content/45">{item.label}</p>
                                                    <p className="mt-1 font-bold">{item.value}</p>
                                                </div>
                                            </div>
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
                        {[
                            { label: "Scholarships and welfare", icon: Heart },
                            { label: "Infrastructure projects", icon: Landmark },
                            { label: "Quiz and academic support", icon: Target },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="flex items-center gap-4 border border-primary-content/10 bg-primary-content/10 p-4">
                                    <div className="grid h-12 w-12 place-items-center bg-secondary text-secondary-content">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">Your gift supports</p>
                                        <p className="text-lg font-bold">{item.label}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </StaggerChildren>
                </div>
            </section>

            <section className="bg-base-200 py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                    <ScrollReveal direction="right">
                        <div className="sticky top-24">
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Why give</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">Give back to the place that helped shape us.</h2>
                            <p className="mt-5 leading-relaxed text-base-content/60">
                                Donations help UPOSA fund visible school priorities and student-facing support, from scholarships to infrastructure improvements.
                            </p>
                            <button type="button" className="btn btn-primary mt-8" onClick={() => openModal()}>
                                Start donation <ArrowRight size={16} />
                            </button>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-4">
                        {impactStories.map((story, index) => (
                            <ScrollReveal key={`${story.name}-${story.year}`} delay={index * 0.08}>
                                <div className="border border-base-300 bg-base-100 p-5 shadow-sm">
                                    <div className="mb-5 flex items-start gap-4">
                                        <div className="grid h-12 w-12 shrink-0 place-items-center bg-secondary text-secondary-content">
                                            <Heart size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">Impact story</p>
                                            <h3 className="mt-1 text-xl font-bold text-primary">{story.name}</h3>
                                        </div>
                                    </div>
                                    <p className="text-base leading-relaxed text-base-content/65">"{story.quote}"</p>
                                    <p className="mt-5 border-t border-base-300 pt-4 text-sm font-bold text-primary">{story.year}</p>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-100 py-16 md:py-24">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-24 top-8 h-[360px] w-[360px] object-contain opacity-[0.035]"
                />
                <div className="mx-auto max-w-7xl px-4">
                    <ScrollReveal>
                        <div className="relative mb-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Payment rails</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight text-primary md:text-5xl">Choose the giving route that works for you.</h2>
                                <p className="mt-4 max-w-2xl text-base leading-relaxed text-base-content/60">
                                    Use manual MoMo or bank rails, or continue through any enabled online provider for card or digital payment.
                                </p>
                            </div>
                            <button type="button" className="btn btn-secondary justify-self-start lg:justify-self-end" onClick={() => openModal()}>
                                Donate now <ArrowRight size={16} />
                            </button>
                        </div>
                    </ScrollReveal>

                    <div className="relative overflow-hidden border border-base-300 bg-base-100 shadow-sm">
                        <div className="grid lg:grid-cols-3">
                            {paymentRails.map((rail) => {
                                const Icon = rail.icon;
                                return (
                                    <button
                                        key={rail.id}
                                        type="button"
                                        className="group flex min-h-[260px] flex-col border-b border-base-300 p-6 text-left transition hover:bg-base-200 lg:border-b-0 lg:border-r"
                                        onClick={rail.action}
                                    >
                                        <div className="mb-7 flex items-start justify-between gap-4">
                                            <div className="grid h-14 w-14 place-items-center bg-secondary text-secondary-content">
                                                <Icon size={24} />
                                            </div>
                                            <span className="border border-base-300 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">Manual</span>
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{rail.subtitle}</p>
                                        <h3 className="mt-2 text-2xl font-bold leading-tight text-primary">{rail.title}</h3>
                                        <div className="mt-6 grid gap-1">
                                            <p className="break-words font-mono text-xl font-bold leading-tight text-primary">{rail.detail}</p>
                                            <p className="text-sm leading-relaxed text-base-content/50">{rail.meta}</p>
                                        </div>
                                        <span className="mt-auto flex items-center justify-between border-t border-base-300 pt-5 text-sm font-bold text-primary">
                                            Start with this rail
                                            <ArrowRight size={17} className="transition group-hover:translate-x-1 group-hover:text-secondary" />
                                        </span>
                                    </button>
                                );
                            })}

                            {onlinePaymentMethods.length > 0 ? (
                                onlinePaymentMethods.slice(0, 1).map((method) => {
                                    const Icon = providerIcons[method.provider] || Globe;
                                    return (
                                        <button
                                            key={method.id}
                                            type="button"
                                            className="group flex min-h-[260px] flex-col bg-base-200 p-6 text-left transition hover:bg-base-100"
                                            onClick={() => {
                                                openModal();
                                                setPaymentMethod(method.provider);
                                                setStep("amount");
                                            }}
                                        >
                                            <div className="mb-7 flex items-start justify-between gap-4">
                                                <div className="grid h-14 w-14 place-items-center bg-secondary text-secondary-content">
                                                    <Icon size={24} />
                                                </div>
                                                <span className="border border-base-300 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">Online</span>
                                            </div>
                                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Online provider</p>
                                            <h3 className="mt-2 text-2xl font-bold leading-tight text-primary">{method.displayName}</h3>
                                            <p className="mt-6 line-clamp-3 text-sm leading-relaxed text-base-content/60">{method.description || "Secure online donation processing."}</p>
                                            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">
                                                {method.supportedCurrencies.join(", ")}
                                            </p>
                                            <span className="mt-auto flex items-center justify-between border-t border-base-300 pt-5 text-sm font-bold text-primary">
                                                Continue online
                                                <ArrowRight size={17} className="transition group-hover:translate-x-1 group-hover:text-secondary" />
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="flex min-h-[260px] flex-col bg-base-200 p-6">
                                    <div className="mb-7 flex items-start justify-between gap-4">
                                        <div className="grid h-14 w-14 place-items-center bg-secondary text-secondary-content">
                                            <Globe size={24} />
                                        </div>
                                        <span className="border border-base-300 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">Soon</span>
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Online provider</p>
                                    <h3 className="mt-2 text-2xl font-bold leading-tight text-primary">Online payment</h3>
                                    <p className="mt-6 text-sm leading-relaxed text-base-content/60">Card and international payment options will appear here when enabled.</p>
                                    <p className="mt-auto border-t border-base-300 pt-5 text-sm font-bold text-base-content/45">No provider enabled yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-base-200 py-16 md:py-24">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] object-contain opacity-[0.03]"
                />
                <div className="relative mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[360px_1fr] lg:items-stretch">
                    <ScrollReveal direction="right">
                        <div className="flex h-full flex-col border border-base-300 bg-base-100 p-6 shadow-sm md:p-8">
                            <div className="mb-8 flex items-start justify-between gap-4">
                                <div className="grid h-14 w-14 place-items-center bg-secondary text-secondary-content">
                                    <PieChart size={24} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/35">Funding split</span>
                            </div>
                            <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Allocation map</p>
                            <h2 className="text-4xl font-bold leading-tight text-primary md:text-5xl">What your donation supports.</h2>
                            <p className="mt-5 text-sm leading-relaxed text-base-content/60">
                                These categories help alumni see how support is spread across student welfare, facilities, and association priorities.
                            </p>
                            <div className="mt-auto pt-8">
                                <div className="flex items-end justify-between gap-4 border-t border-base-300 pt-6">
                                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-base-content/35">Total assigned</span>
                                    <span className="text-4xl font-bold leading-none text-primary">{totalAllocation}%</span>
                                </div>
                                <div className="mt-4 h-2 bg-base-300">
                                    <div className="h-full bg-secondary" style={{ width: `${Math.min(totalAllocation, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </ScrollReveal>

                    <div className="overflow-hidden border border-base-300 bg-base-100 shadow-sm">
                        {donationAllocation.map((item, index) => (
                            <ScrollReveal key={item.title} delay={index * 0.05}>
                                <div className="grid gap-5 border-b border-base-300 p-5 last:border-b-0 md:grid-cols-[90px_1fr_132px] md:items-center md:p-6">
                                    <div className="flex items-center gap-4 md:block">
                                        <div className="grid h-14 w-14 shrink-0 place-items-center bg-secondary text-sm font-bold text-secondary-content">
                                            {String(index + 1).padStart(2, "0")}
                                        </div>
                                        <p className="text-3xl font-bold leading-none text-primary md:mt-5 md:hidden">{item.percentage}%</p>
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-xl font-bold leading-tight text-primary">{item.title}</h3>
                                            <span className="border border-base-300 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">
                                                {item.percentage}% share
                                            </span>
                                        </div>
                                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-base-content/60">{item.description}</p>
                                        <div className="mt-4 h-2 bg-base-300">
                                            <div className="h-full bg-secondary" style={{ width: `${item.percentage}%` }} />
                                        </div>
                                    </div>

                                    <div className="hidden text-right md:block">
                                        <p className="text-5xl font-bold leading-none text-primary">{item.percentage}%</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-base-content/35">of gifts</p>
                                    </div>
                                </div>
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-primary text-primary-content">
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-28 top-4 h-[420px] w-[420px] object-contain opacity-[0.045]"
                />
                <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-20">
                    <ScrollReveal>
                        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-secondary">Ready to help</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Choose an amount and move a priority forward.</h2>
                                <p className="mt-5 max-w-2xl leading-relaxed text-primary-content/60">
                                    No amount is too small. Every contribution becomes part of a visible alumni support record.
                                </p>
                            </div>
                            <button type="button" className="btn btn-secondary w-fit" onClick={() => openModal()}>
                                Enter custom gift <ArrowRight size={16} />
                            </button>
                        </div>
                    </ScrollReveal>

                    <div className="overflow-hidden border border-primary-content/12 bg-primary-content/10">
                        <div className="grid lg:grid-cols-[1fr_340px]">
                            <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                                {[...heroAmounts, 1000].map((amount) => (
                                    <button
                                        key={amount}
                                        type="button"
                                        className="group flex min-h-[168px] flex-col border-b border-primary-content/12 p-6 text-left transition hover:bg-primary-content/10 sm:border-r xl:border-b-0"
                                        onClick={() => openModal(amount)}
                                    >
                                        <span className="block text-xs font-bold uppercase tracking-[0.16em] text-primary-content/45">Donate</span>
                                        <span className="mt-3 block text-3xl font-bold leading-none text-secondary">{formatMoney(currency, amount)}</span>
                                        <span className="mt-auto flex items-center justify-between border-t border-primary-content/12 pt-5 text-sm font-bold text-primary-content/70">
                                            Select amount
                                            <ArrowRight size={18} className="transition group-hover:translate-x-1 group-hover:text-secondary" />
                                        </span>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="group flex min-h-[168px] flex-col bg-secondary p-6 text-left text-secondary-content transition hover:bg-secondary/90"
                                onClick={() => openModal()}
                            >
                                <span className="block text-xs font-bold uppercase tracking-[0.16em] opacity-70">Custom gift</span>
                                <span className="mt-3 block max-w-xs text-3xl font-bold leading-tight">Enter your own amount</span>
                                <span className="mt-auto flex items-center justify-between border-t border-secondary-content/20 pt-5 text-sm font-bold">
                                    Open amount field
                                    <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) setModalOpen(false);
                        }}
                    >
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 24 }}
                            transition={{ duration: 0.2 }}
                            className="w-full max-w-2xl overflow-hidden border border-base-300 bg-base-100 shadow-2xl"
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-base-300 bg-primary p-5 text-primary-content">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">{step === "success" ? "Donation received" : "Donation checkout"}</p>
                                    <h3 className="mt-2 text-2xl font-bold">{step === "success" ? "Thank you for giving" : "Make a donation"}</h3>
                                </div>
                                <button type="button" className="btn btn-ghost btn-sm text-primary-content hover:bg-primary-content/10" onClick={() => setModalOpen(false)} aria-label="Close donation modal">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="max-h-[76vh] overflow-y-auto p-5 md:p-6">
                                {step !== "success" && <StepMarker currentStep={step} />}

                                {step === "amount" && (
                                    <div className="mt-6 space-y-5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-base-content/45">Choose a quick amount or enter your own.</p>
                                            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                                {presetAmounts.map((amount) => (
                                                    <button
                                                        key={amount}
                                                        type="button"
                                                        className={`border px-3 py-2.5 text-[13px] font-bold leading-none transition ${
                                                            Number(customAmount) === amount ? "border-secondary bg-secondary text-secondary-content" : "border-base-300 bg-base-200 text-primary hover:border-primary/25"
                                                        }`}
                                                        onClick={() => setCustomAmount(String(amount))}
                                                    >
                                                        {formatMoney(currency, amount)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <label className="form-control">
                                            <span className="label pb-2">
                                                <span className="label-text text-xs font-bold uppercase tracking-[0.16em] text-primary">Custom amount</span>
                                            </span>
                                            <label className="flex h-12 items-center gap-3 border border-base-300 bg-base-200 px-4 text-sm">
                                                <span className="font-bold text-base-content/45">{currency}</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    className="min-w-0 grow bg-transparent font-semibold text-primary outline-none placeholder:text-base-content/45"
                                                    value={customAmount}
                                                    onChange={(event) => setCustomAmount(event.target.value)}
                                                />
                                            </label>
                                        </label>

                                        <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-5">
                                            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm disabled:!border-primary/15 disabled:!bg-primary/10 disabled:!text-primary/45 disabled:!opacity-100 disabled:!shadow-none"
                                                disabled={!hasValidAmount}
                                                onClick={() => setStep("payment")}
                                            >
                                                Continue <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "payment" && (
                                    <div className="mt-6 space-y-5">
                                        <div className="border border-secondary/20 bg-secondary/10 p-4 text-center">
                                            <p className="text-sm font-semibold text-base-content/50">Donation amount</p>
                                            <p className="mt-1 text-3xl font-bold text-primary">{formatMoney(currency, finalAmount)}</p>
                                        </div>

                                        <div>
                                            <p className="mb-3 text-sm font-bold text-primary">Select a payment method</p>
                                            <div className="grid gap-3">
                                                {[
                                                    { id: "momo", title: "Mobile Money", description: "Pay via MTN, Vodafone, or AirtelTigo", icon: Smartphone },
                                                    { id: "bank", title: "Bank Transfer", description: "Direct bank deposit or transfer", icon: Building2 },
                                                ].map((method) => {
                                                    const Icon = method.icon;
                                                    const active = paymentMethod === method.id;
                                                    return (
                                                        <button
                                                            key={method.id}
                                                            type="button"
                                                            className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 border p-3 text-left transition ${
                                                                active ? "border-secondary bg-secondary/10" : "border-base-300 bg-base-200 hover:border-primary/25"
                                                            }`}
                                                            onClick={() => setPaymentMethod(method.id)}
                                                        >
                                                            <span className={`grid h-12 w-12 place-items-center ${active ? "bg-secondary text-secondary-content" : "bg-primary/5 text-primary"}`}>
                                                                <Icon size={20} />
                                                            </span>
                                                            <span>
                                                                <span className="block font-bold text-primary">{method.title}</span>
                                                                <span className="mt-1 block text-sm text-base-content/50">{method.description}</span>
                                                            </span>
                                                            <CheckCircle2 size={18} className={active ? "text-secondary" : "text-base-content/20"} />
                                                        </button>
                                                    );
                                                })}

                                                {onlinePaymentMethods.map((method) => {
                                                    const Icon = providerIcons[method.provider] || Globe;
                                                    const active = paymentMethod === method.provider;
                                                    return (
                                                        <button
                                                            key={method.id}
                                                            type="button"
                                                            className={`grid grid-cols-[48px_1fr_auto] items-center gap-3 border p-3 text-left transition ${
                                                                active ? "border-secondary bg-secondary/10" : "border-base-300 bg-base-200 hover:border-primary/25"
                                                            }`}
                                                            onClick={() => setPaymentMethod(method.provider)}
                                                        >
                                                            <span className={`grid h-12 w-12 place-items-center ${active ? "bg-secondary text-secondary-content" : "bg-primary/5 text-primary"}`}>
                                                                <Icon size={20} />
                                                            </span>
                                                            <span>
                                                                <span className="block font-bold text-primary">{method.displayName}</span>
                                                                <span className="mt-1 block text-sm text-base-content/50">{method.description || "Secure online payment"}</span>
                                                            </span>
                                                            <CheckCircle2 size={18} className={active ? "text-secondary" : "text-base-content/20"} />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-5">
                                            <button type="button" className="btn btn-ghost" onClick={() => (isCustom ? setStep("amount") : setModalOpen(false))}>
                                                Back
                                            </button>
                                            <button type="button" className="btn btn-primary" disabled={!paymentMethod} onClick={() => setStep("confirm")}>
                                                Continue <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "confirm" && (
                                    <div className="mt-6 space-y-5">
                                        <div className="border border-secondary/20 bg-secondary/10 p-4 text-center">
                                            <p className="text-sm font-semibold text-base-content/50">Donation amount</p>
                                            <p className="mt-1 text-3xl font-bold text-primary">{formatMoney(currency, finalAmount)}</p>
                                        </div>

                                        {paymentMethod === "momo" && (
                                            <div className="border border-base-300 bg-base-200 p-5">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="grid h-11 w-11 place-items-center bg-secondary text-secondary-content">
                                                        <Smartphone size={18} />
                                                    </div>
                                                    <h4 className="font-bold text-primary">Mobile Money instructions</h4>
                                                </div>
                                                <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-base-content/60">
                                                    <li>Dial your network's mobile money shortcode.</li>
                                                    <li>Select send money or MoMo Pay.</li>
                                                    <li>Enter the number or Pay ID below and confirm with your PIN.</li>
                                                </ol>
                                                <div className="mt-5 bg-base-100 p-4">
                                                    <DetailRow
                                                        label="Number"
                                                        value={<span className="font-mono">{payment.momo.number}</span>}
                                                        action={
                                                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleCopy(payment.momo.number)} aria-label="Copy MoMo number">
                                                                {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                                                            </button>
                                                        }
                                                    />
                                                    <DetailRow label="MoMo Pay ID" value={payment.momo.payId} />
                                                    <DetailRow label="Registered name" value={payment.momo.accountName} />
                                                    <DetailRow label="Amount" value={formatMoney(currency, finalAmount)} />
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod === "bank" && (
                                            <div className="border border-base-300 bg-base-200 p-5">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="grid h-11 w-11 place-items-center bg-secondary text-secondary-content">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <h4 className="font-bold text-primary">Bank transfer details</h4>
                                                </div>
                                                <div className="bg-base-100 p-4">
                                                    <DetailRow label="Bank" value={payment.bank.bank} />
                                                    <DetailRow label="Branch" value={payment.bank.branch} />
                                                    <DetailRow label="Account name" value={payment.bank.accountName} />
                                                    <DetailRow
                                                        label="Account no."
                                                        value={<span className="font-mono">{payment.bank.accountNo}</span>}
                                                        action={
                                                            <button type="button" className="btn btn-ghost btn-xs" onClick={() => handleCopy(payment.bank.accountNo)} aria-label="Copy bank account number">
                                                                {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                                                            </button>
                                                        }
                                                    />
                                                    <DetailRow label="Reference" value={`Donation - ${finalAmount}`} />
                                                </div>
                                            </div>
                                        )}

                                        {isOnlineMethod && selectedOnlineMethod && (
                                            <div className="border border-base-300 bg-base-200 p-5">
                                                <div className="mb-4 flex items-center gap-3">
                                                    <div className="grid h-11 w-11 place-items-center bg-secondary text-secondary-content">
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <h4 className="font-bold text-primary">Pay with {selectedOnlineMethod.displayName}</h4>
                                                </div>

                                                {feeLoading && (
                                                    <div className="mb-4 bg-base-100 p-4">
                                                        <div className="space-y-3">
                                                            <SkeletonBlock className="h-4 w-2/3 bg-primary/10" />
                                                            <SkeletonBlock className="h-4 w-1/2 bg-primary/10" />
                                                            <SkeletonBlock className="h-4 w-3/4 bg-primary/10" />
                                                        </div>
                                                    </div>
                                                )}

                                                {feePreview && feePreview.enabled && feePreview.platformFee > 0 && (
                                                    <div className="mb-4 bg-base-100 p-4">
                                                        <DetailRow label="Donation" value={formatMoney(currency, feePreview.amount)} />
                                                        <DetailRow
                                                            label={`Platform fee (${feePreview.percent}%${(feePreview.fixed ?? 0) > 0 ? ` + ${formatMoney(currency, feePreview.fixed)}` : ""})`}
                                                            value={formatMoney(currency, feePreview.platformFee)}
                                                        />
                                                        <DetailRow label="Total to pay" value={formatMoney(currency, feePreview.totalAmount)} />
                                                    </div>
                                                )}

                                                <p className="text-sm leading-relaxed text-base-content/60">
                                                    You will be redirected to {selectedOnlineMethod.displayName} to complete your donation securely.
                                                </p>

                                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                    <label className="form-control">
                                                        <span className="label pb-2">
                                                            <span className="label-text text-sm font-bold text-primary">Email *</span>
                                                        </span>
                                                        <input
                                                            type="email"
                                                            className="input input-bordered bg-base-100"
                                                            placeholder="your@email.com"
                                                            value={donorEmail}
                                                            onChange={(event) => setDonorEmail(event.target.value)}
                                                            required
                                                        />
                                                    </label>
                                                    <label className="form-control">
                                                        <span className="label pb-2">
                                                            <span className="label-text text-sm font-bold text-primary">Name</span>
                                                        </span>
                                                        <input
                                                            type="text"
                                                            className="input input-bordered bg-base-100"
                                                            placeholder="Full name"
                                                            value={donorName}
                                                            onChange={(event) => setDonorName(event.target.value)}
                                                        />
                                                    </label>
                                                </div>

                                                <div className="mt-4 border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/50">
                                                    Accepted currencies: {selectedOnlineMethod.supportedCurrencies.join(", ")}. All transactions are encrypted and secure.
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-3 border-t border-base-300 pt-5">
                                            <button type="button" className="btn btn-ghost" onClick={() => setStep("payment")}>
                                                Back
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                disabled={initiating || (!!isOnlineMethod && !donorEmail.trim())}
                                                onClick={handleConfirm}
                                            >
                                                {initiating ? <SkeletonBlock className="h-4 w-32 bg-primary-content/25" /> : isOnlineMethod ? "Proceed to payment" : "I've made the transfer"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {step === "success" && (
                                    <div className="py-8 text-center">
                                        <motion.div
                                            initial={{ scale: 0.86 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 220, damping: 18 }}
                                            className="mx-auto mb-6 grid h-24 w-24 place-items-center bg-success/10 text-success"
                                        >
                                            <CheckCircle2 size={46} />
                                        </motion.div>
                                        <h4 className="text-2xl font-bold text-primary">Thank you for your generosity.</h4>
                                        <p className="mx-auto mt-4 max-w-md leading-relaxed text-base-content/60">
                                            Your donation of <strong className="text-primary">{formatMoney(currency, finalAmount)}</strong> will help support University Practice students and UPOSA priorities.
                                        </p>
                                        {!isOnlineMethod && (
                                            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-base-content/45">
                                                If you completed a MoMo or bank transfer, the team will verify it and follow up with a confirmation receipt.
                                            </p>
                                        )}
                                        <button type="button" className="btn btn-primary mt-7" onClick={() => setModalOpen(false)}>
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Donate;
