import React, { useState, useEffect } from 'react';
import { UserProfile, PlanTier, ContactSettings, ReviewerConfig, SocialPlatform, ScheduleFrequency, AddOn, ContactPerson, SubscriptionPlan, Source, Coupon, CustomerStatus } from '../types';
import { db, INITIAL_PROFILE } from '../services/database';
import { notificationService } from '../services/notifications';
import { geminiService } from '../services/geminiService';
import { ArrowRight, Check, Sparkles, User, Users, Loader2, X, Plus, CreditCard, Mail, Calendar, LayoutGrid, UploadCloud, Smartphone, MessageSquare, Clock, RotateCcw, Globe, AlertCircle, HelpCircle, Edit2, Shield, Lock, Ticket, ExternalLink, Copy } from 'lucide-react';
import { OwlLogo } from '../components/OwlLogo';
import { Link, useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config';

interface Props {
  onComplete: () => void;
}

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [analysisSources, setAnalysisSources] = useState<Source[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [completed, setCompleted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [forecastDates, setForecastDates] = useState<Date[]>([]);
  const [smsTesting, setSmsTesting] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);

  // Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // New State for Multi-Reviewer Input
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newReviewerEmail, setNewReviewerEmail] = useState("");

  // Support / Fallback State
  const [analysisError, setAnalysisError] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSent, setSupportSent] = useState(false);

  // Payment State
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const industrySuggestions = ['Tech', 'Finance', 'Healthcare', 'Real Estate', 'Marketing', 'Legal'];

  useEffect(() => {
    const loadData = async () => {
      const p = await db.getPlans();
      const a = await db.getAddOns();
      setAvailablePlans(p.filter(plan => plan.active));
      const activeAddons = a.filter(addon => addon.active);
      setAvailableAddOns(activeAddons);
      setProfile(prev => ({...prev, addOns: activeAddons}));
    };
    loadData();
    
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      updateProfile('timezone', detected);
    }
  }, []);

  useEffect(() => {
    if (step === 5 && !profile.contact.primary.name && profile.name) {
      setProfile(p => ({
        ...p,
        contact: { ...p.contact, primary: { ...p.contact.primary, name: p.name } }
      }));
    }
  }, [step]);

  useEffect(() => {
    if (step === 7 && !completed && isGenerating) {
        handleFinish();
    }
  }, [step, isGenerating]);

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile(prev => {
      if (key === 'plan') {
        const selected = availablePlans.find(p => p.name === value);
        const schedule = selected ? selected.frequency : prev.schedule;
        return { ...prev, [key]: value, schedule, planId: selected?.id };
      }
      return { ...prev, [key]: value };
    });
  };

  const updateContact = (field: 'primary' | 'ccEmail' | 'preferredChannel', value: any) => {
    setProfile(prev => ({ 
      ...prev, 
      contact: { ...prev.contact, [field]: value } 
    }));
  };

  const updateReviewer = (key: keyof ReviewerConfig, value: any) => {
    setProfile(prev => ({
      ...prev,
      reviewer: { ...prev.reviewer, [key]: value }
    }));
  };

  const addReviewerMember = () => {
    if (newReviewerName && newReviewerEmail) {
      const newMember: ContactPerson = { name: newReviewerName, email: newReviewerEmail };
      updateReviewer('teamMembers', [...profile.reviewer.teamMembers, newMember]);
      setNewReviewerName("");
      setNewReviewerEmail("");
    }
  };

  const toggleAddon = (id: string) => {
    const updated = profile.addOns.map(a => a.id === id ? { ...a, selected: !a.selected } : a);
    updateProfile('addOns', updated);
  };

  const togglePlatform = (platform: SocialPlatform) => {
    const current = profile.platforms || [];
    const selectedPlan = availablePlans.find(p => p.id === profile.planId);
    let maxPlatforms = selectedPlan?.maxPlatforms || 1;
    
    const extraPlatformAddon = profile.addOns.find(a => a.name.toLowerCase().includes('platform') && a.selected);
    if (extraPlatformAddon) {
        maxPlatforms += 1;
    }

    if (current.includes(platform)) {
      updateProfile('platforms', current.filter(p => p !== platform));
    } else {
      if (current.length >= maxPlatforms) {
          alert(`Your plan (${selectedPlan?.name}) allows up to ${maxPlatforms} platform(s). Upgrade plan or select Add-on.`);
          return;
      }
      updateProfile('platforms', [...current, platform]);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile('brandLogoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalysis = async () => {
    const missingFields = [];
    if (!profile.name) missingFields.push("Name");
    if (!profile.role) missingFields.push("Role");
    if (!profile.industry) missingFields.push("Industry");
    if (!profile.website) missingFields.push("Website");
    if (!profile.timezone) missingFields.push("Timezone");

    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(false);
    setStep(3); 
    try {
      const result = await geminiService.analyzeUserExpertise(
        profile.name, 
        profile.role, 
        profile.industry || "Tech", 
        profile.website,
        profile.description
      );
      
      if (!result.topics || result.topics.length === 0) {
          throw new Error("No topics found");
      }

      updateProfile('expertise', result.topics);
      setAnalysisSummary(result.analysis);
      setAnalysisSources(result.sources || []);
    } catch (error) {
      console.error(error);
      setAnalysisError(true);
      if (profile.contact.primary.email) setSupportEmail(profile.contact.primary.email);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSupportSubmit = async () => {
      if (!supportEmail) return alert("Please enter your email.");
      const updatedProfile = {
          ...profile,
          contact: {
              ...profile.contact,
              primary: { ...profile.contact.primary, email: supportEmail }
          }
      };
      setProfile(updatedProfile);
      await db.createSupportTicket(updatedProfile, "Strategic Analysis Failed - User Requesting Manual Setup");
      setSupportSent(true);
  };

  const handleTestSMS = async () => {
    const phone = profile.contact.primary.phone;
    if (!phone) return alert("Enter phone number first");
    const phoneRegex = /^(\+1|1)?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
       return alert("Please enter a valid US phone number (e.g., 555-0199 or +15550199)");
    }
    setSmsTesting(true);
    await notificationService.sendTestSMS(phone);
    setSmsTesting(false);
    setSmsVerified(true);
  };

  const validateStep5 = () => {
      setPasswordError("");
      if (!password) {
          setPasswordError("Password is required.");
          return false;
      }
      if (password.length < 6) {
          setPasswordError("Password must be at least 6 characters.");
          return false;
      }
      if (password !== confirmPassword) {
          setPasswordError("Passwords do not match.");
          return false;
      }
      updateProfile('password', password);
      setStep(6);
      return true;
  };

  const handleFinish = async () => {
    // 1. Forecast delivery schedule for summary
    const schedule = db.getDeliverySchedule(profile.schedule).slice(0, 10); // Next ~2 weeks roughly
    setForecastDates(schedule);
    
    const finalProfile = { 
      ...profile, 
      isOnboarded: true,
      subscriptionStatus: 'ACTIVE' as const
    };
    await db.updateUser(finalProfile);

    // Unique URL based on user name/id and domain
    const userSlug = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dashboardUrl = `https://${userSlug}.${APP_CONFIG.DOMAIN}`;

    // 2. Trigger prompt generation and welcome email
    (async () => {
      try {
        const firstDate = db.calculateNextSlot([], finalProfile.schedule);
        const firstPrompt = await geminiService.generateDailyPrompt(finalProfile);
        await db.schedulePrompt(firstPrompt.id, firstDate.toISOString());
        await notificationService.notifyWelcome(finalProfile, dashboardUrl, schedule);
      } catch (err) {
        console.error("Background processing error:", err);
      }
    })();

    // 3. Simulated loading time then show success summary
    setTimeout(() => {
      setIsGenerating(false);
      setCompleted(true);
    }, 2500);
  };

  const addTopic = () => {
    if (newTopic.trim()) {
      updateProfile('expertise', [...profile.expertise, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const removeTopic = (topicToRemove: string) => {
    updateProfile('expertise', profile.expertise.filter(t => t !== topicToRemove));
  };

  const handlePlanSelection = (planName: string) => {
      updateProfile('plan', planName as PlanTier);
      setPaymentError("");
      setShowPayment(true);
  };

  const handleApplyCoupon = async () => {
      if (!couponCode) return;
      const coupons = await db.getCoupons();
      const found = coupons.find(c => c.code === couponCode && c.active);
      if (found) {
          setAppliedCoupon(found);
          setCouponCode(""); 
      } else {
          setPaymentError("Invalid coupon code.");
          setTimeout(() => setPaymentError(""), 3000);
      }
  };

  const handlePaymentSubmit = () => {
      setPaymentError("");
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 15) {
          setPaymentError("Please enter a valid card number.");
          return;
      }
      if (!cardExpiry) {
          setPaymentError("Please enter expiration date (MM/YY).");
          return;
      }
      if (!cardCVC || cardCVC.length < 3) {
          setPaymentError("Please enter a valid CVC.");
          return;
      }
      setShowPayment(false);
      setStep(2);
  };

  const handleDashboardRedirect = () => {
      onComplete();
      navigate('/');
  };

  if (completed) {
    const userSlug = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dashboardUrl = `${userSlug}.${APP_CONFIG.DOMAIN}`;
    
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
          <div className="bg-slate-900 p-10 text-center text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tv-teal opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <OwlLogo size={64} className="mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Welcome to {APP_CONFIG.PLATFORM_NAME}</h2>
            <p className="text-slate-400">Your strategic identity engine is now active.</p>
          </div>
          
          <div className="p-10 space-y-8">
             <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Your Private Workspace</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-tv-teal/10 rounded-lg text-tv-teal"><Globe size={20} /></div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Dashboard URL</p>
                            <p className="font-bold text-slate-900">{dashboardUrl}</p>
                        </div>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-tv-teal transition-colors" title="Copy Link"><Copy size={18} /></button>
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1"><Mail size={12} /> Check your inbox for your login credentials and portal link.</p>
             </section>

             <section>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Delivery Forecast</h3>
                    <span className="text-[10px] font-black text-tv-teal bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider">{profile.schedule.replace(/_/g, ' ')}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {forecastDates.slice(0, 5).map((date, i) => (
                        <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
                            <p className="text-lg font-black text-slate-900 leading-none">{date.getDate()}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{date.toLocaleDateString(undefined, { month: 'short' })}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                    <Sparkles className="text-blue-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Based on your 2-week forecast, your strategy engine will deliver its first daily briefing on <strong>{forecastDates[0]?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</strong>.
                    </p>
                </div>
             </section>

             <button 
                onClick={handleDashboardRedirect}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
             >
                Enter Dashboard <ArrowRight size={20} />
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
          <div className="h-full bg-gradient-to-r from-tv-teal to-tv-coral transition-all duration-500" style={{ width: `${(step / 7) * 100}%` }} />
        </div>

        <div className="p-12">
          <div className="flex justify-center mb-6">
             <OwlLogo size={48} />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {showPayment ? "Secure Payment" :
               step === 1 ? "Choose your Service Level" :
               step === 2 ? "Tell us about you" :
               step === 3 ? "Strategic Alignment" :
               step === 4 ? "Strategy & Schedule" :
               step === 5 ? "Account & Communication" :
               step === 6 ? "Review Profile" :
               "Setting up your Workspace..."}
            </h1>
          </div>

          {showPayment ? (
             <div className="space-y-6 animate-fade-in max-w-md mx-auto">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase">Selected Plan</div>
                    <div className="text-lg font-bold text-slate-900 flex justify-between items-center">
                        {profile.plan}
                        {appliedCoupon && (
                            <span className="text-green-600 text-sm font-normal">
                                {appliedCoupon.discountType === 'PERCENT' ? `${appliedCoupon.discountValue}% OFF` : `$${appliedCoupon.discountValue} OFF`}
                            </span>
                        )}
                    </div>
                 </div>
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        placeholder="Promo Code" 
                        className="flex-1 p-3 border rounded-lg font-mono uppercase text-sm"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                     />
                     <button onClick={handleApplyCoupon} className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200">Apply</button>
                 </div>
                 <div className="space-y-4">
                    {paymentError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium flex items-center gap-2">
                            <AlertCircle size={16} /> {paymentError}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Card Number</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 p-3 border rounded-lg" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Expiry</label>
                            <input type="text" placeholder="MM/YY" className="w-full p-3 border rounded-lg" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">CVC</label>
                            <input type="text" placeholder="123" className="w-full p-3 border rounded-lg" value={cardCVC} onChange={e => setCardCVC(e.target.value)} />
                        </div>
                    </div>
                 </div>
                 <button onClick={handlePaymentSubmit} className="w-full py-3 bg-tv-teal text-white font-bold rounded-lg hover:bg-teal-600 mt-6 shadow-lg shadow-teal-500/20">
                     Complete Payment
                 </button>
                 <button onClick={() => setShowPayment(false)} className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm">Back to Plans</button>
             </div>
          ) : step === 1 ? (
            <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
              <div className="grid grid-cols-1 gap-4">
                 {availablePlans.map(plan => (
                     <div key={plan.id} onClick={() => handlePlanSelection(plan.name)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${profile.plan === plan.name ? 'border-tv-teal bg-teal-50' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div className="flex justify-between font-bold mb-2"><span>{plan.name}</span><span>${plan.price}/mo</span></div>
                        <p className="text-sm text-slate-600 mb-2">{plan.description}</p>
                        <div className="flex gap-2 mb-2">
                            {plan.deliverables.map(d => <span key={d} className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200">{d}</span>)}
                        </div>
                        <div className="text-xs text-slate-400 font-bold">
                            Includes {plan.maxPlatforms} Platform{plan.maxPlatforms > 1 ? 's' : ''}
                        </div>
                     </div>
                 ))}
              </div>
               <div className="mt-8 pt-4 border-t border-slate-100 text-center space-y-2">
                  <div className="text-sm">
                    Already have an account? <Link to="/login" className="font-bold text-slate-900 hover:underline">Log in</Link>
                  </div>
                  <Link to="/internal" className="block text-xs text-slate-400 hover:text-tv-teal transition-colors pt-2">Staff Portal Login</Link>
               </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal" placeholder="Jane Doe" value={profile.name} onChange={e => updateProfile('name', e.target.value)} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Current Role <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal" placeholder="CEO, Founder..." value={profile.role} onChange={e => updateProfile('role', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Industry <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {industrySuggestions.map(ind => (
                    <button key={ind} onClick={() => updateProfile('industry', ind)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${profile.industry === ind ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {ind}
                    </button>
                  ))}
                </div>
                <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal" placeholder="Or type your specific niche..." value={profile.industry} onChange={e => updateProfile('industry', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Website <span className="text-red-500">*</span></label>
                        <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal" placeholder="company.com" value={profile.website} onChange={e => updateProfile('website', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">LinkedIn URL <span className="text-slate-400 font-normal">(Optional)</span></label>
                        <input type="text" className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal" placeholder="linkedin.com/in/username" value={profile.linkedin} onChange={e => updateProfile('linkedin', e.target.value)} />
                    </div>
                 </div>
                 <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Brand Logo (Optional)</label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative group">
                       <input type="file" accept="image/*" onChange={handleLogoUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                       <div className="flex flex-col items-center justify-center gap-2">
                         {logoFile ? (
                           <>
                             <img src={profile.brandLogoUrl} alt="Logo Preview" className="h-12 object-contain mb-1" />
                             <span className="text-xs text-green-600 font-bold">{logoFile.name}</span>
                           </>
                         ) : (
                           <>
                             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><UploadCloud size={20} /></div>
                             <span className="text-xs text-slate-500 font-medium">Upload file</span>
                           </>
                         )}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Bio / Description (Optional)</label>
                  <textarea className="w-full p-4 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal resize-none" rows={2} placeholder="What is your company's mission?" value={profile.description || ''} onChange={e => updateProfile('description', e.target.value)} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Timezone <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-4 top-4 text-slate-400" />
                    <select value={profile.timezone} onChange={e => updateProfile('timezone', e.target.value)} className="w-full p-4 pl-10 bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-tv-teal appearance-none">
                      {((Intl as any).supportedValuesOf ? (Intl as any).supportedValuesOf('timeZone') : ["UTC", "America/New_York"]).map((tz: string) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Communication Style</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {['Professional', 'Casual', 'Authoritative', 'Empathetic', 'Controversial', 'Educational'].map(t => (
                    <button key={t} onClick={() => updateProfile('toneStyle', t)} className={`p-2 rounded-lg text-xs font-bold border transition-colors ${profile.toneStyle === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={handleAnalysis} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 flex items-center gap-2">Analyze & Continue <ArrowRight size={16} /></button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                   <Loader2 size={48} className="text-tv-teal animate-spin mb-4" />
                   <h3 className="text-xl font-bold text-slate-900">Researching your digital footprint...</h3>
                </div>
              ) : analysisError ? (
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><AlertCircle size={32} /></div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Automatic Analysis Failed</h3>
                      <p className="text-slate-600 mb-6 max-w-md mx-auto">We couldn't retrieve enough public data. Our research team can manually build your profile.</p>
                      {supportSent ? (
                          <div className="bg-green-100 text-green-800 p-4 rounded-xl font-bold flex items-center justify-center gap-2"><Check size={20} /> Request Sent! Check your email.</div>
                      ) : (
                          <div className="max-w-xs mx-auto space-y-3">
                              <input type="email" placeholder="Confirm your email address" className="w-full p-3 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
                              <button onClick={handleSupportSubmit} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-2"><HelpCircle size={18} /> Request Manual Setup</button>
                          </div>
                      )}
                      <button onClick={() => setStep(2)} className="mt-6 text-sm text-slate-500 hover:underline">Go back and try different inputs</button>
                  </div>
              ) : (
                <>
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6 relative">
                     <h4 className="text-sm font-bold text-blue-800 mb-1">Strategy Found</h4>
                     <p className="text-sm text-blue-700">{analysisSummary}</p>
                     <button onClick={handleAnalysis} className="absolute top-4 right-4 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100" title="Regenerate Analysis"><RotateCcw size={16} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                      {profile.expertise.map((topic, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-sm">
                          {topic} <X size={14} className="cursor-pointer" onClick={() => removeTopic(topic)} />
                        </span>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <input type="text" className="flex-1 p-3 rounded-lg border border-slate-200" placeholder="Add topic..." value={newTopic} onChange={e => setNewTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTopic()} />
                      <button onClick={addTopic} className="px-4 bg-slate-100 rounded-lg"><Plus /></button>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={() => setStep(4)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center gap-2">Confirm <ArrowRight size={16} /></button>
                  </div>
                </>
              )}
            </div>
          ) : step === 4 ? (
            <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
              <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Target Platforms</h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                        Selected {profile.platforms.length}/{availablePlans.find(p => p.id === profile.planId)?.maxPlatforms || 1}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {Object.values(SocialPlatform).map((p) => (
                     <div key={p} onClick={() => togglePlatform(p)} className={`p-3 rounded-xl border-2 cursor-pointer text-center text-sm ${profile.platforms.includes(p) ? 'border-tv-teal bg-teal-50 text-tv-teal' : 'border-slate-100'}`}>
                        {p}
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="font-bold mb-2">Delivery Schedule</h3>
                <p className="text-sm text-slate-500 mb-4">Configured by your plan.</p>
                <div className="w-full p-3 rounded-lg bg-white border border-slate-300 text-slate-600 font-bold opacity-75 flex justify-between items-center">
                   <span>{profile.schedule.replace(/_/g, ' ')}</span>
                   {availablePlans.find(p => p.id === profile.planId)?.activeDays?.map(d => ['S','M','T','W','T','F','S'][d]).join(', ')}
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Add-On Offerings</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {profile.addOns.map(addon => (
                    <div key={addon.id} onClick={() => toggleAddon(addon.id)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${addon.selected ? 'border-tv-teal bg-teal-50 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
                       <div>
                          <div className="font-bold text-slate-900">{addon.name}</div>
                          <div className="text-xs text-slate-500">{addon.description}</div>
                       </div>
                       <div className="font-bold text-tv-teal">+${addon.price}/mo</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button onClick={() => setStep(5)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center gap-2">Next <ArrowRight size={16} /></button>
              </div>
            </div>
          ) : step === 5 ? (
             <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
               <div className="bg-white rounded-xl">
                 <h3 className="font-bold mb-4 text-slate-900 flex items-center gap-2"><User size={18} /> Prompt Recipient & Account</h3>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="text" value={profile.contact.primary.name} onChange={e => setProfile(p => ({...p, contact: {...p.contact, primary: {...p.contact.primary, name: e.target.value}}}))} placeholder="Recipient Name" className="p-3 border rounded-lg bg-slate-50" />
                    <input type="email" value={profile.contact.primary.email} onChange={e => setProfile(p => ({...p, contact: {...p.contact, primary: {...p.contact.primary, email: e.target.value}}}))} placeholder="Primary Email" className="p-3 border rounded-lg bg-slate-50" />
                 </div>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create Password" className="w-full p-3 pl-10 border rounded-lg bg-slate-50" />
                    </div>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="p-3 border rounded-lg bg-slate-50" />
                 </div>
                 {passwordError && <div className="text-red-500 text-xs mb-4 font-bold flex items-center gap-1"><AlertCircle size={12} /> {passwordError}</div>}
                 <div className="mb-4 flex gap-4">
                    <div className="flex-1">
                      <input type="tel" value={profile.contact.primary.phone} onChange={e => setProfile(p => ({...p, contact: {...p.contact, primary: {...p.contact.primary, phone: e.target.value}}}))} placeholder="Mobile Number (US)" className="w-full p-3 border rounded-lg bg-slate-50" />
                    </div>
                    <button onClick={handleTestSMS} className={`px-4 rounded-lg font-bold text-sm ${smsVerified ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white'}`} disabled={smsTesting || smsVerified}>
                      {smsTesting ? <Loader2 className="animate-spin" /> : smsVerified ? "Verified" : "Test SMS"}
                    </button>
                 </div>
                 <div>
                    <input type="email" value={profile.contact.ccEmail || ''} onChange={e => updateContact('ccEmail', e.target.value)} placeholder="CC Email (Optional)" className="w-full p-3 border rounded-lg bg-slate-50" />
                 </div>
               </div>
               <hr className="border-slate-100" />
               <div>
                 <h3 className="font-bold mb-4 text-slate-900 flex items-center gap-2"><Users size={18} /> Review Team</h3>
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div onClick={() => updateReviewer('mode', 'SELF')} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${profile.reviewer.mode === 'SELF' ? 'border-tv-teal bg-teal-50' : 'border-slate-100'}`}>
                      <OwlLogo size={32} className="mx-auto mb-2" /> Self Review
                    </div>
                    <div onClick={() => updateReviewer('mode', 'TEAM')} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${profile.reviewer.mode === 'TEAM' ? 'border-tv-teal bg-teal-50' : 'border-slate-100'}`}>
                      <div className="relative w-12 h-10 mx-auto mb-2">
                         <OwlLogo size={32} className="absolute left-0 top-0 opacity-70" />
                         <OwlLogo size={32} className="absolute left-3 top-1" />
                      </div>
                      Team Review
                    </div>
                 </div>
                 {profile.reviewer.mode === 'TEAM' && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <h4 className="text-xs font-bold uppercase text-slate-500 mb-3">Team Members</h4>
                       {profile.reviewer.teamMembers?.map((m, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg mb-2 shadow-sm">
                             <span className="text-sm font-medium">{m.name} ({m.email})</span>
                             <button className="text-red-400 hover:text-red-600"><X size={14} /></button>
                          </div>
                       ))}
                       <div className="flex gap-2 mt-2">
                          <input type="text" placeholder="Name" className="flex-1 p-2 text-sm border rounded" value={newReviewerName} onChange={e => setNewReviewerName(e.target.value)} />
                          <input type="email" placeholder="Email" className="flex-1 p-2 text-sm border rounded" value={newReviewerEmail} onChange={e => setNewReviewerEmail(e.target.value)} />
                          <button onClick={addReviewerMember} className="bg-tv-teal text-white p-2 rounded"><Plus size={16} /></button>
                       </div>
                    </div>
                 )}
               </div>
               <div className="mt-8 flex justify-end">
                <button onClick={validateStep5} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium flex items-center gap-2">Next <ArrowRight size={16} /></button>
               </div>
             </div>
          ) : step === 6 ? (
             <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group">
                         <button onClick={() => setStep(2)} className="absolute top-4 right-4 text-slate-400 hover:text-tv-teal opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} /></button>
                         <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><User size={16} className="text-tv-teal" /> Identity</h4>
                         <div className="space-y-2 text-sm">
                             <div className="flex justify-between"><span className="text-slate-500">Name</span> <span className="font-medium text-slate-800">{profile.name}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Role</span> <span className="font-medium text-slate-800">{profile.role}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Industry</span> <span className="font-medium text-slate-800">{profile.industry}</span></div>
                         </div>
                     </div>
                     <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm relative group">
                         <button onClick={() => setStep(4)} className="absolute top-4 right-4 text-slate-400 hover:text-tv-teal opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} /></button>
                         <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><CreditCard size={16} className="text-tv-teal" /> Subscription</h4>
                         <div className="space-y-2 text-sm">
                             <div className="flex justify-between"><span className="text-slate-500">Plan</span> <span className="font-medium text-slate-800">{profile.plan}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Channels</span> <span className="font-medium text-slate-800">{profile.platforms.length} Selected</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Add-Ons</span> <span className="font-medium text-slate-800">{profile.addOns.filter(a => a.selected).length}</span></div>
                         </div>
                     </div>
                 </div>

                 <div className="mt-8 flex justify-end">
                    <button 
                        onClick={() => { setStep(7); setIsGenerating(true); }} 
                        className="px-8 py-3 bg-tv-teal text-white rounded-xl font-bold flex items-center gap-2 hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                    >
                       Create Account <Check size={16} />
                    </button>
                 </div>
             </div>
          ) : (
             <div className="py-20 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-24 h-24 relative mb-8">
                   <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-tv-teal rounded-full border-t-transparent animate-spin"></div>
                   <OwlLogo size={48} className="absolute inset-0 m-auto animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Setting up your Workspace</h2>
                <p className="text-slate-500 max-w-md">We are initializing your strategy engine and configuring your dashboard. This will only take a moment.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};