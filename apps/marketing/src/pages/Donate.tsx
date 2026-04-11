import { Layout } from "../components/layout/Layout.tsx";
import { Heart, Building, Smartphone, Globe, X, CheckCircle2, Copy, Bitcoin, CreditCard, HandCoins, PieChart } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ScrollReveal } from "../components/common/ScrollReveal.tsx";
import { StaggerChildren } from "../components/common/StaggerChildren.tsx";
import HeroBanner from "../components/common/HeroBanner.tsx";
import SectionHeader from "../components/common/SectionHeader.tsx";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteData } from "../context/SiteDataContext.tsx";
import SplashScreen from "../components/common/SplashScreen.tsx";
import { Card, CardAccent, CardBody } from "../components/ui/Card.tsx";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PaymentMethodData {
    id: string;
    provider: string;
    displayName: string;
    description?: string;
    isEnabled: boolean;
    supportedCurrencies: string[];
    countries: string[];
}

const defaultImpactStories = [
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

type SelectedMethod = "momo" | "bank" | string | null;

const providerIcons: Record<string, typeof Globe> = {
    PAYSTACK: CreditCard,
    STRIPE: CreditCard,
    CRYPTO: Bitcoin,
};

const Donate = () => {
    const { data, loading } = useSiteData();
    const [onlinePaymentMethods, setOnlinePaymentMethods] = useState<PaymentMethodData[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<SelectedMethod>(null);
    const [step, setStep] = useState<"amount" | "payment" | "confirm" | "success">("amount");
    const [copied, setCopied] = useState(false);
    const [initiating, setInitiating] = useState(false);
    const [donorEmail, setDonorEmail] = useState("");
    const [donorName, setDonorName] = useState("");
    const modalRef = useRef<HTMLDivElement>(null);

    // Fetch enabled payment methods
    useEffect(() => {
        fetch(`${API_BASE}/payment-methods`)
            .then((res) => res.json())
            .then((json) => {
                if (json.data) setOnlinePaymentMethods(json.data);
            })
            .catch(() => {});
    }, []);

    const openModal = (amount?: number) => {
        if (amount) {
            setSelectedAmount(amount);
            setIsCustom(false);
            setStep("payment");
        } else {
            setSelectedAmount(null);
            setIsCustom(true);
            setStep("amount");
        }
        setPaymentMethod(null);
        setCopied(false);
        setDonorEmail("");
        setDonorName("");
        setModalOpen(true);
    };

    const finalAmount = isCustom ? Number(customAmount) : selectedAmount;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isOnlineMethod = paymentMethod && !["momo", "bank"].includes(paymentMethod);
    const selectedOnlineMethod = onlinePaymentMethods.find((m) => m.provider === paymentMethod);

    const handleConfirm = async () => {
        if (isOnlineMethod && selectedOnlineMethod) {
            // Validate email for online payment
            if (!donorEmail.trim()) return;
            setInitiating(true);
            try {
                // Create donation first
                const donationRes = await fetch(`${API_BASE}/donations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        donorName: donorName || 'Anonymous',
                        donorEmail: donorEmail,
                        amount: finalAmount,
                        currency: data?.config.dues.currency || 'GHS',
                        channel: selectedOnlineMethod.provider,
                        purpose: 'General Donation',
                    }),
                });
                const donationJson = await donationRes.json();
                const donationId = donationJson.data?.id;

                // Initialize payment
                const paymentRes = await fetch(`${API_BASE}/payments/initialize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        provider: selectedOnlineMethod.provider,
                        purpose: 'DONATION',
                        amount: finalAmount,
                        currency: data?.config.dues.currency || 'GHS',
                        email: donorEmail,
                        name: donorName || undefined,
                        donationId,
                        callbackUrl: `${window.location.origin}/donate?status=success`,
                    }),
                });
                const paymentJson = await paymentRes.json();
                if (paymentJson.data?.authorizationUrl) {
                    window.location.href = paymentJson.data.authorizationUrl;
                    return;
                }
                // Fallback to success step if no redirect
                setStep("success");
            } catch {
                // Show success anyway for UX (payment may still process)
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
        return () => { document.body.style.overflow = ""; };
    }, [modalOpen]);

    if (loading || !data) {
        return <SplashScreen />;
    }

    const payment = data.config.payment;
    const donationAllocation = data.config.donationAllocation;
    const currency = data.config.dues.currency;

    return (
        <Layout>
            <HeroBanner icon={Heart} title="Donate / Support Us" description="Your generous contributions help us transform lives and improve our school. Every cedi counts." />

            {/* Why Donate */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={Heart} title="Why Donate?" description="Your contributions directly impact student lives and school development." align="left" />
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <ScrollReveal direction="left" delay={0.1}>
                            <div>
                                <p className="text-base-content/60 mb-4">
                                    Your donations directly impact the lives of students at University Practice SHS. From funding scholarships for brilliant but needy students to renovating school infrastructure, every contribution creates lasting change.
                                </p>
                                <p className="text-base-content/60">
                                    As alumni, we have a unique opportunity to give back to the institution that shaped us. Together, we can ensure that future generations have even better opportunities than we did.
                                </p>
                            </div>
                        </ScrollReveal>
                        <div className="space-y-4">
                            {((data?.config as any)?.impactStories?.length > 0 ? (data?.config as any).impactStories : defaultImpactStories).map((story: { quote: string; name: string; year: string }, i: number) => (
                                <ScrollReveal key={story.name} delay={0.15 + i * 0.1}>
                                    <Card shape="wave">
                                        <CardAccent />
                                        <CardBody>
                                            <p className="text-sm text-base-content/60 italic">"{story.quote}"</p>
                                            <div className="border-t border-base-300 pt-3 mt-2">
                                                <p className="text-xs font-semibold">{story.name} &middot; {story.year}</p>
                                            </div>
                                        </CardBody>
                                    </Card>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Donate */}
            <section className="py-16 bg-base-200">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={HandCoins} title="How to Donate" description="Choose the payment method that works best for you." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                        <Card className="h-full">
                            <CardAccent color="secondary" />
                            <CardBody className="items-center text-center flex flex-col flex-1">
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                    <Smartphone size={28} />
                                </div>
                                <h3 className="font-bold text-lg mt-2">Mobile Money (MoMo)</h3>
                                <p className="text-sm text-base-content/60">Send to:</p>
                                <p className="font-mono font-semibold text-primary text-lg">{payment.momo.number}</p>
                                <div className="border-t border-base-300 w-full pt-3 mt-auto space-y-1">
                                    <p className="text-xs text-base-content/50">MoMo Pay ID: {payment.momo.payId}</p>
                                    <p className="text-xs text-base-content/50">Name: {payment.momo.accountName}</p>
                                </div>
                            </CardBody>
                        </Card>
                        <Card className="h-full">
                            <CardAccent color="secondary" />
                            <CardBody className="items-center text-center flex flex-col flex-1">
                                <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                    <Building size={28} />
                                </div>
                                <h3 className="font-bold text-lg mt-2">Bank Transfer</h3>
                                <div className="border-t border-base-300 w-full pt-3 mt-auto text-sm text-base-content/60 text-left space-y-1">
                                    <p><span className="font-medium">Bank:</span> {payment.bank.bank}</p>
                                    <p><span className="font-medium">Account No:</span> {payment.bank.accountNo}</p>
                                    <p><span className="font-medium">Name:</span> {payment.bank.accountName}</p>
                                    <p><span className="font-medium">Branch:</span> {payment.bank.branch}</p>
                                </div>
                            </CardBody>
                        </Card>
                        {onlinePaymentMethods.length > 0 ? (
                            onlinePaymentMethods.map((method) => {
                                const Icon = providerIcons[method.provider] || Globe;
                                return (
                                    <Card key={method.id} className="h-full">
                                        <CardAccent color="secondary" />
                                        <CardBody className="items-center text-center flex flex-col flex-1">
                                            <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                <Icon size={28} />
                                            </div>
                                            <h3 className="font-bold text-lg mt-2">{method.displayName}</h3>
                                            <p className="text-sm text-base-content/60">{method.description}</p>
                                            <div className="border-t border-base-300 w-full pt-3 mt-auto">
                                                <button className="btn btn-primary btn-sm w-full" onClick={() => openModal()}>Donate with {method.displayName}</button>
                                            </div>
                                        </CardBody>
                                    </Card>
                                );
                            })
                        ) : (
                            <Card className="h-full">
                                <CardAccent color="secondary" />
                                <CardBody className="items-center text-center flex flex-col flex-1">
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                        <Globe size={28} />
                                    </div>
                                    <h3 className="font-bold text-lg mt-2">Online Payment</h3>
                                    <p className="text-sm text-base-content/60">For international donations</p>
                                    <div className="border-t border-base-300 w-full pt-3 mt-auto">
                                        <button className="btn btn-primary btn-sm w-full" onClick={() => openModal()}>Donate Online</button>
                                    </div>
                                </CardBody>
                            </Card>
                        )}
                    </StaggerChildren>
                </div>
            </section>

            {/* What Donations Support */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <SectionHeader icon={PieChart} title="What Your Donations Support" description="See how your contributions are allocated across key areas." align="left" />
                    <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {donationAllocation.map((item) => (
                            <Card key={item.title} className="h-full">
                                <CardAccent />
                                <CardBody className="items-center text-center flex flex-col">
                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                        <Heart size={24} />
                                    </div>
                                    <h3 className="font-semibold mt-2">{item.title}</h3>
                                    <p className="text-3xl font-bold text-primary">{item.percentage}%</p>
                                    <div className="w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-gradient-to-r from-secondary to-secondary/80 h-full rounded-full" style={{ width: `${item.percentage}%` }} />
                                    </div>
                                    <p className="text-sm text-base-content/60 mt-1">{item.description}</p>
                                </CardBody>
                            </Card>
                        ))}
                    </StaggerChildren>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-20 bg-primary text-primary-content overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001B50] via-[#002870] to-[#1E3A8A]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <ScrollReveal>
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
                            <Heart size={14} className="text-secondary" />
                            <span className="text-sm font-medium text-white/80">Support Us</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Make a Difference Today</h2>
                        <p className="mb-8 text-white/70 max-w-lg mx-auto">
                            No amount is too small. Your contribution helps build a brighter future for University Practice students.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <button className="btn btn-secondary shadow-lg shadow-secondary/25" onClick={() => openModal(50)}>Donate {currency} 50</button>
                            <button className="btn btn-secondary shadow-lg shadow-secondary/25" onClick={() => openModal(100)}>Donate {currency} 100</button>
                            <button className="btn btn-secondary shadow-lg shadow-secondary/25" onClick={() => openModal(500)}>Donate {currency} 500</button>
                            <button className="btn btn-outline border-white/20 text-white hover:bg-white/10 hover:border-white/30" onClick={() => openModal()}>Custom Amount</button>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* Donation Modal */}
            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
                    >
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card hover={false} className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <CardAccent color="secondary" />
                            <CardBody>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-lg">
                                        {step === "success" ? "Thank You!" : "Make a Donation"}
                                    </h3>
                                    <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setModalOpen(false)}>
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Step 1: Custom Amount */}
                                {step === "amount" && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-base-content/60">Enter your donation amount:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[50, 100, 200, 500, 1000].map((amt) => (
                                                <button
                                                    key={amt}
                                                    className={`btn btn-sm ${Number(customAmount) === amt ? "btn-primary" : "btn-outline"}`}
                                                    onClick={() => setCustomAmount(String(amt))}
                                                >
                                                    {currency} {amt}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="form-control">
                                            <label className="label"><span className="label-text font-medium">Or enter a custom amount</span></label>
                                            <label className="input input-bordered flex items-center gap-2">
                                                <span className="font-semibold text-base-content/50">{currency}</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="0"
                                                    className="grow bg-transparent outline-none"
                                                    value={customAmount}
                                                    onChange={(e) => setCustomAmount(e.target.value)}
                                                />
                                            </label>
                                        </div>
                                        <button
                                            className="btn btn-primary w-full"
                                            disabled={!customAmount || Number(customAmount) <= 0}
                                            onClick={() => setStep("payment")}
                                        >
                                            Continue
                                        </button>
                                    </div>
                                )}

                                {/* Step 2: Payment Method */}
                                {step === "payment" && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl p-4 text-center border border-secondary/20">
                                            <p className="text-sm text-base-content/50">Donation Amount</p>
                                            <p className="text-2xl font-bold text-primary">{currency} {finalAmount?.toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-base-content/60">Select a payment method:</p>
                                        <div className="space-y-2">
                                            {/* Manual methods */}
                                            <button
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${paymentMethod === "momo" ? "border-primary bg-primary/10 shadow-sm" : "border-base-300 hover:border-primary hover:shadow-sm"}`}
                                                onClick={() => setPaymentMethod("momo")}
                                            >
                                                <div className={`rounded-xl p-2.5 ${paymentMethod === "momo" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/50"}`}>
                                                    <Smartphone size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">Mobile Money (MoMo)</p>
                                                    <p className="text-xs text-base-content/50">Pay via MTN, Vodafone, or AirtelTigo</p>
                                                </div>
                                            </button>
                                            <button
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${paymentMethod === "bank" ? "border-primary bg-primary/10 shadow-sm" : "border-base-300 hover:border-primary hover:shadow-sm"}`}
                                                onClick={() => setPaymentMethod("bank")}
                                            >
                                                <div className={`rounded-xl p-2.5 ${paymentMethod === "bank" ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/50"}`}>
                                                    <Building size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">Bank Transfer</p>
                                                    <p className="text-xs text-base-content/50">Direct bank deposit or transfer</p>
                                                </div>
                                            </button>
                                            {/* Online payment providers from API */}
                                            {onlinePaymentMethods.map((method) => {
                                                const Icon = providerIcons[method.provider] || Globe;
                                                return (
                                                    <button
                                                        key={method.id}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left ${paymentMethod === method.provider ? "border-primary bg-primary/10 shadow-sm" : "border-base-300 hover:border-primary hover:shadow-sm"}`}
                                                        onClick={() => setPaymentMethod(method.provider)}
                                                    >
                                                        <div className={`rounded-xl p-2.5 ${paymentMethod === method.provider ? "bg-secondary/10 text-secondary" : "bg-base-200 text-base-content/50"}`}>
                                                            <Icon size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{method.displayName}</p>
                                                            <p className="text-xs text-base-content/50">{method.description}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="border-t border-base-300 pt-4 flex gap-2">
                                            <button className="btn btn-ghost btn-sm" onClick={() => setStep("amount")}>Back</button>
                                            <button
                                                className="btn btn-primary flex-1"
                                                disabled={!paymentMethod}
                                                onClick={() => setStep("confirm")}
                                            >
                                                Continue
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Confirm / Instructions */}
                                {step === "confirm" && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl p-4 text-center border border-secondary/20">
                                            <p className="text-sm text-base-content/50">Donation Amount</p>
                                            <p className="text-2xl font-bold text-primary">{currency} {finalAmount?.toLocaleString()}</p>
                                        </div>

                                        {paymentMethod === "momo" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                        <Smartphone size={18} />
                                                    </div>
                                                    <h4 className="font-semibold text-sm">Mobile Money Instructions</h4>
                                                </div>
                                                <ol className="text-sm text-base-content/60 space-y-2 list-decimal pl-5">
                                                    <li>Dial <span className="font-mono font-semibold">*170#</span> (MTN) or your network's shortcode</li>
                                                    <li>Select <strong>Send Money</strong></li>
                                                    <li>Enter the number below:</li>
                                                </ol>
                                                <div className="flex items-center gap-2 bg-base-200 rounded-xl p-3 border border-base-300">
                                                    <span className="font-mono font-bold text-primary flex-1">{payment.momo.number}</span>
                                                    <button className="btn btn-ghost btn-xs" onClick={() => handleCopy(payment.momo.number)}>
                                                        {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                <div className="border-t border-base-300 pt-3 space-y-1">
                                                    <p className="text-xs text-base-content/50">MoMo Pay ID: <strong>{payment.momo.payId}</strong></p>
                                                    <p className="text-xs text-base-content/50">Registered Name: <strong>{payment.momo.accountName}</strong></p>
                                                    <p className="text-xs text-base-content/50">Enter <strong>{currency} {finalAmount?.toLocaleString()}</strong> as the amount and confirm with your PIN.</p>
                                                </div>
                                            </div>
                                        )}

                                        {paymentMethod === "bank" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                        <Building size={18} />
                                                    </div>
                                                    <h4 className="font-semibold text-sm">Bank Transfer Details</h4>
                                                </div>
                                                <div className="bg-base-200 rounded-xl p-3 space-y-1 text-sm border border-base-300">
                                                    <p><span className="text-base-content/50">Bank:</span> <strong>{payment.bank.bank}</strong></p>
                                                    <p><span className="text-base-content/50">Branch:</span> <strong>{payment.bank.branch}</strong></p>
                                                    <p><span className="text-base-content/50">Account Name:</span> <strong>{payment.bank.accountName}</strong></p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base-content/50">Account No:</span>
                                                        <span className="font-mono font-bold text-primary">{payment.bank.accountNo}</span>
                                                        <button className="btn btn-ghost btn-xs" onClick={() => handleCopy(payment.bank.accountNo)}>
                                                            {copied ? <CheckCircle2 size={14} className="text-success" /> : <Copy size={14} />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="border-t border-base-300 pt-3">
                                                    <p className="text-xs text-base-content/50">Use <strong>"Donation - {finalAmount}"</strong> as the reference.</p>
                                                </div>
                                            </div>
                                        )}

                                        {isOnlineMethod && selectedOnlineMethod && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-secondary/10 text-secondary rounded-xl p-2.5">
                                                        <CreditCard size={18} />
                                                    </div>
                                                    <h4 className="font-semibold text-sm">Pay with {selectedOnlineMethod.displayName}</h4>
                                                </div>
                                                <p className="text-sm text-base-content/60">
                                                    You will be redirected to {selectedOnlineMethod.displayName} to complete your donation of <strong>{currency} {finalAmount?.toLocaleString()}</strong> securely.
                                                </p>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text text-sm">Your Email *</span></label>
                                                    <input
                                                        type="email"
                                                        className="input input-bordered input-sm"
                                                        placeholder="your@email.com"
                                                        value={donorEmail}
                                                        onChange={(e) => setDonorEmail(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="form-control">
                                                    <label className="label"><span className="label-text text-sm">Your Name (optional)</span></label>
                                                    <input
                                                        type="text"
                                                        className="input input-bordered input-sm"
                                                        placeholder="Full name"
                                                        value={donorName}
                                                        onChange={(e) => setDonorName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="bg-base-200 rounded-xl p-3 text-xs text-base-content/50 space-y-1 border border-base-300">
                                                    <p>Accepted: {selectedOnlineMethod.supportedCurrencies.join(', ')}</p>
                                                    <p>All transactions are encrypted and secure.</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="border-t border-base-300 pt-4 flex gap-2">
                                            <button className="btn btn-ghost btn-sm" onClick={() => setStep("payment")}>Back</button>
                                            <button
                                                className={`btn btn-primary flex-1 ${initiating ? "loading" : ""}`}
                                                disabled={initiating || (!!isOnlineMethod && !donorEmail.trim())}
                                                onClick={handleConfirm}
                                            >
                                                {initiating ? "Processing..." : isOnlineMethod ? "Proceed to Payment" : "I've Made the Transfer"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 4: Success */}
                                {step === "success" && (
                                    <div className="text-center space-y-4 py-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                        >
                                            <div className="bg-success/10 text-success rounded-full p-4 inline-flex">
                                                <CheckCircle2 size={48} />
                                            </div>
                                        </motion.div>
                                        <h4 className="text-xl font-bold">Thank You for Your Generosity!</h4>
                                        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl p-4 border border-secondary/20">
                                            <p className="text-sm text-base-content/60">
                                                Your donation of <strong className="text-primary">{currency} {finalAmount?.toLocaleString()}</strong> will make a real difference in the lives of University Practice students.
                                            </p>
                                        </div>
                                        {!isOnlineMethod && (
                                            <p className="text-xs text-base-content/50">
                                                If you completed a MoMo or bank transfer, our team will verify and send you a confirmation receipt.
                                            </p>
                                        )}
                                        <div className="border-t border-base-300 pt-4">
                                            <button className="btn btn-primary" onClick={() => setModalOpen(false)}>Close</button>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default Donate;
