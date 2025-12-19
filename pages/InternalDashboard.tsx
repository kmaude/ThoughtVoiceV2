import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, MOCK_TEAM, WORKFLOWS_DEFAULT, INITIAL_PROFILE } from '../services/database';
import { notificationService } from '../services/notifications';
import { geminiService } from '../services/geminiService';
import { ContentItem, ContentStatus, TeamMember, DailyPrompt, PromptStatus, UserProfile, CustomerStatus, ActivityLog, CRMReport, SubscriptionPlan, Coupon, ScheduleFrequency, PlanTier, SocialPlatform, Invoice, InvoiceStatus, EmploymentType, ClientPayment, WorkflowDefinition, SupportTicket, AddOn } from '../types';
import { Clock, Layout, Users, Activity, ArrowLeft, X, Folder, Sparkles, Lightbulb, Calendar, BrainCircuit, RefreshCcw, ChevronDown, ChevronRight, CalendarDays, BarChart3, UserPlus, CreditCard, Save, Edit3, Briefcase, Globe, Linkedin, Twitter, Smartphone, Zap, CheckCircle, Ticket, Tag, LogOut, UploadCloud, FileUp, DollarSign, FileText, UserCog, AlertCircle, TrendingUp, TrendingDown, Wallet, Plus, Send, Video, FileAudio, CalendarPlus, MoveRight, MoreHorizontal, Eye, ThumbsUp, ThumbsDown, MessageSquare, Trash2, User, BookOpen, Download, Database, Key, HelpCircle, Loader2, RefreshCw, Lock, ExternalLink, Link as LinkIcon, FolderOpen, Image, Timer, Inbox, ToggleLeft, ToggleRight } from 'lucide-react';
import { OwlLogo } from '../components/OwlLogo';

const LAUNCH_GUIDE_CONTENT = `THOUGHTVOICE MVP LAUNCH GUIDE...`; // (Truncated for brevity)

interface ProductionMetrics {
    mtd: { count: number; growth: number };
    qtd: { count: number; growth: number };
    ytd: { count: number; growth: number };
    avgCycleHours: number;
    avgCycleGrowth: number;
    stageBreakdown: { stage: string; hours: number; color: string }[];
}

export const InternalDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Data State
  const [queue, setQueue] = useState<ContentItem[]>([]);
  const [scheduledPrompts, setScheduledPrompts] = useState<DailyPrompt[]>([]);
  const [activeTab, setActiveTab] = useState<string>('QUEUE');
  const [pendingPrompts, setPendingPrompts] = useState<DailyPrompt[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // CRM State
  const [crmUsers, setCrmUsers] = useState<UserProfile[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<UserProfile | null>(null);
  const [subjectContent, setSubjectContent] = useState<ContentItem[]>([]);
  const [subjectPayments, setSubjectPayments] = useState<ClientPayment[]>([]);
  const [crmReport, setCrmReport] = useState<CRMReport | null>(null);
  const [productionReport, setProductionReport] = useState<ProductionMetrics | null>(null);
  const [llmInstructions, setLlmInstructions] = useState('');
  const [activeSubjectTab, setActiveSubjectTab] = useState<'PROFILE' | 'PRODUCTION' | 'LLM' | 'PAYMENTS'>('PROFILE');
  const [isAddingLeader, setIsAddingLeader] = useState(false);
  const [newLeader, setNewLeader] = useState<Partial<UserProfile> & { email?: string, phone?: string }>({
      name: '', role: '', industry: '', email: '', website: '', linkedin: '', description: '', toneStyle: 'Professional', plan: PlanTier.PRO, customerStatus: CustomerStatus.ONBOARDING, expertise: []
  });
  const [isEditingSubject, setIsEditingSubject] = useState(false); 
  const [isEditingIdentity, setIsEditingIdentity] = useState(false); 
  const [editedSubject, setEditedSubject] = useState<Partial<UserProfile>>({});
  
  // Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isProcessingTicket, setIsProcessingTicket] = useState(false);
  
  // Filter State
  const [promptFilterLeader, setPromptFilterLeader] = useState<string>('ALL');
  const [researchFocus, setResearchFocus] = useState<string>('Strategic');

  // Scheduling State
  const [promptSchedulingId, setPromptSchedulingId] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Kanban Modals
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [selectedKanbanItem, setSelectedKanbanItem] = useState<ContentItem | null>(null);
  const [selectedPromptItem, setSelectedPromptItem] = useState<DailyPrompt | null>(null);
  const [kanbanMode, setKanbanMode] = useState<'PROMPT' | 'CONTENT'>('CONTENT');

  // Modal Editing States
  const [editPromptText, setEditPromptText] = useState('');
  const [editPromptDate, setEditPromptDate] = useState('');
  const [assignEditorId, setAssignEditorId] = useState('');

  // Subscriptions State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  
  // Modal State for Subscription Items
  const [planModal, setPlanModal] = useState<{ isOpen: boolean; data: Partial<SubscriptionPlan> }>({ isOpen: false, data: {} });
  const [addOnModal, setAddOnModal] = useState<{ isOpen: boolean; data: Partial<AddOn> }>({ isOpen: false, data: {} });
  const [couponModal, setCouponModal] = useState<{ isOpen: boolean; data: Partial<Coupon> }>({ isOpen: false, data: {} });

  // Accounting State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [billingProcessing, setBillingProcessing] = useState(false);

  // My Settings Editable State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<TeamMember>>({});

  // Workflow/SLA State
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [isAddingWorkflow, setIsAddingWorkflow] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<Partial<WorkflowDefinition>>({ name: '', slaHours: 24, type: 'STANDARD' });

  // Team Management State
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState<Partial<TeamMember>>({
    name: '', role: 'Editor', email: '', phone: '', slackHandle: '', status: 'AVAILABLE', currentLoad: 0, avatar: 'NM', employmentType: '1099', hourlyRate: 0
  });
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  
  // Agent Research State
  const [isResearching, setIsResearching] = useState(false);
  const [researchTone, setResearchTone] = useState<string>('Use Profile Default');
  
  // Database Integration State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [dbMigrationStatus, setDbMigrationStatus] = useState<'IDLE' | 'MIGRATING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [migrationCount, setMigrationCount] = useState(0);

  const groupedPrompts = pendingPrompts.reduce((acc, p) => {
    if (!acc[p.userId]) acc[p.userId] = [];
    acc[p.userId].push(p);
    return acc;
  }, {} as Record<string, DailyPrompt[]>);

  const ALL_TABS = [
    { id: 'QUEUE', icon: Layout, label: 'Kanban' },
    { id: 'PROMPTS', icon: Lightbulb, label: 'Agent Research' },
    { id: 'CRM', icon: Users, label: 'Leaders' },
    { id: 'NOTICES', icon: AlertCircle, label: 'Notices' },
    { id: 'TEAM', icon: Briefcase, label: 'Team' },
    { id: 'SUBSCRIPTIONS', icon: CreditCard, label: 'Plans' },
    { id: 'ACCOUNTING', icon: DollarSign, label: 'Accounting' },
    { id: 'REPORTS', icon: BarChart3, label: 'Reports' },
    { id: 'WORKFLOWS', icon: Activity, label: 'SLA' },
    { id: 'DATABASE', icon: Database, label: 'Database' },
    { id: 'MY_PROFILE', icon: UserCog, label: 'My Settings' }
  ];

  const getVisibleTabs = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return ALL_TABS;
    if (currentUser.role === 'Account Manager') return ALL_TABS.filter(t => ['QUEUE', 'PROMPTS', 'CRM', 'NOTICES', 'WORKFLOWS', 'SUBSCRIPTIONS', 'MY_PROFILE'].includes(t.id));
    if (currentUser.role === 'Editor') return ALL_TABS.filter(t => ['QUEUE', 'WORKFLOWS', 'MY_PROFILE'].includes(t.id));
    return [ALL_TABS.find(t => t.id === 'MY_PROFILE')!];
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      setEditedUser(currentUser);
      const config = db.getSupabaseConfig();
      if (config) {
          setSupabaseUrl(config.url);
          setSupabaseKey(config.key);
      }
    }
  }, [currentUser]);

  const calculateProductionMetrics = (allItems: ContentItem[]): ProductionMetrics => {
      const now = new Date();
      const publishedVideos = allItems.filter(i => i.type === 'VIDEO' && (i.status === ContentStatus.PUBLISHED || i.status === ContentStatus.APPROVED));
      
      const getCountForPeriod = (start: Date, end: Date) => {
          return publishedVideos.filter(i => {
              const d = new Date(i.createdAt);
              return d >= start && d <= end;
          }).length;
      };

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const mtdCount = getCountForPeriod(startOfMonth, now);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const lastMtdCount = getCountForPeriod(startOfLastMonth, endOfLastMonthSameDay);
      const mtdGrowth = lastMtdCount === 0 ? 100 : ((mtdCount - lastMtdCount) / lastMtdCount) * 100;

      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const qtdCount = getCountForPeriod(startOfQuarter, now);
      
      const startOfLastQuarter = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
      const daysIntoQuarter = (now.getTime() - startOfQuarter.getTime());
      const endOfLastQuarterSameDay = new Date(startOfLastQuarter.getTime() + daysIntoQuarter);
      const lastQtdCount = getCountForPeriod(startOfLastQuarter, endOfLastQuarterSameDay);
      const qtdGrowth = lastQtdCount === 0 ? 100 : ((qtdCount - lastQtdCount) / lastQtdCount) * 100;

      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const ytdCount = getCountForPeriod(startOfYear, now);
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYearSameDay = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const lastYtdCount = getCountForPeriod(startOfLastYear, endOfLastYearSameDay);
      const ytdGrowth = lastYtdCount === 0 ? 100 : ((ytdCount - lastYtdCount) / lastYtdCount) * 100;

      let totalCycleTime = 0;
      let cycleCount = 0;
      publishedVideos.forEach(v => {
          const start = new Date(v.createdAt).getTime();
          const publishedLog = v.history?.find(h => h.stage === ContentStatus.PUBLISHED || h.stage === ContentStatus.APPROVED);
          const end = publishedLog ? new Date(publishedLog.timestamp).getTime() : now.getTime(); 
          totalCycleTime += (end - start);
          cycleCount++;
      });
      const avgCycleHours = cycleCount > 0 ? (totalCycleTime / cycleCount) / (1000 * 60 * 60) : 0;

      const avgEdit = 24.5; 
      const avgReview = 12.2;
      const avgQueue = 4.5; 
      const avgPublish = 2.1;

      return {
          mtd: { count: mtdCount, growth: mtdGrowth },
          qtd: { count: qtdCount, growth: qtdGrowth },
          ytd: { count: ytdCount, growth: ytdGrowth },
          avgCycleHours: avgCycleHours || 48.5, 
          avgCycleGrowth: -5.2, 
          stageBreakdown: [
              { stage: 'Queue / Assign', hours: avgQueue, color: '#FDBA74' }, 
              { stage: 'Editing', hours: avgEdit, color: '#60A5FA' }, 
              { stage: 'Review', hours: avgReview, color: '#A78BFA' }, 
              { stage: 'Publishing', hours: avgPublish, color: '#34D399' } 
          ]
      };
  };

  const loadData = async () => {
    if (!currentUser) return;

    let items = await db.getEmployeeQueue();
    let queueItems = items; 
    if (currentUser.role === 'Editor') {
       queueItems = items.filter(i => i.assignedTo === currentUser.id);
    } else if (currentUser.role === 'Account Manager') {
       const allUsers = await db.getAllUsers();
       const myUserIds = allUsers.filter(u => u.accountManagerId === currentUser.id).map(u => u.id);
       queueItems = items.filter(i => myUserIds.includes(i.userId));
    }
    setQueue(queueItems);
    
    const prodMetrics = calculateProductionMetrics(items);
    setProductionReport(prodMetrics);

    const sPrompts = db.getScheduledPrompts();
    setScheduledPrompts(sPrompts);
    const prompts = db.getPendingPrompts();
    setPendingPrompts(prompts);
    const user = await db.getUser();
    setUserProfile(user);
    const team = await db.getTeam();
    setTeamMembers(team);
    const users = await db.getAllUsers();
    setCrmUsers(users);
    const p = await db.getPlans();
    setPlans(p);
    const c = await db.getCoupons();
    setCoupons(c);
    const a = await db.getAddOns();
    setAddOns(a);
    const inv = await db.getInvoices();
    setInvoices(inv);
    const payments = await db.getClientPayments();
    setClientPayments(payments);
    const report = await db.generateCRMReport();
    setCrmReport(report);
    const wfs = await db.getWorkflows();
    setWorkflows(wfs);
    const supportTickets = await db.getSupportTickets();
    setTickets(supportTickets);
  };

  const handleLogin = async () => {
      setLoginError('');
      const user = await db.staffLogin(loginEmail, loginPass);
      if (user) {
          setCurrentUser(user);
          setActiveTab('QUEUE');
      } else {
          setLoginError('Invalid email or password. (Try thoughtvoice123)');
      }
  };
  
  const handleSaveSupabase = () => { 
      if (supabaseUrl && supabaseKey) {
          db.saveSupabaseConfig(supabaseUrl, supabaseKey);
          alert("Configuration Saved.");
      }
  };
  const handleMigrate = async () => { 
      if (supabaseUrl && supabaseKey) {
          setDbMigrationStatus('MIGRATING');
          const res = await db.migrateToSupabase(supabaseUrl, supabaseKey);
          if (res.success) {
              setDbMigrationStatus('SUCCESS');
              setMigrationCount(res.count || 0);
          } else {
              setDbMigrationStatus('ERROR');
          }
      }
  };
  
  const handleRunBilling = async () => { 
      setBillingProcessing(true);
      await db.runBillingCycle();
      await loadData();
      setBillingProcessing(false);
      alert("Billing Cycle Complete");
  };
  
  const openTicket = (ticket: SupportTicket) => { 
    setSelectedTicket(ticket); 
  };

  const handleResolveTicket = async () => {
      if (selectedTicket) {
          setIsProcessingTicket(true);
          await db.resolveTicket(selectedTicket.id);
          setIsProcessingTicket(false);
          setSelectedTicket(null);
          loadData();
      }
  };
  
  const handleCreateLeader = async () => {
      if (newLeader.name && newLeader.email) {
          const profile: UserProfile = {
              ...INITIAL_PROFILE,
              id: `u-${Date.now()}`,
              name: newLeader.name || '',
              role: newLeader.role || '',
              industry: newLeader.industry || '',
              website: newLeader.website || '',
              linkedin: newLeader.linkedin || '',
              description: newLeader.description || '',
              toneStyle: newLeader.toneStyle || 'Professional',
              customerStatus: newLeader.customerStatus || CustomerStatus.ONBOARDING,
              plan: newLeader.plan || PlanTier.PRO,
              expertise: newLeader.expertise || [],
              contact: { ...INITIAL_PROFILE.contact, primary: { name: newLeader.name || '', email: newLeader.email || '', phone: newLeader.phone } },
              joinDate: new Date().toISOString()
          };
          await db.crmCreateUser(profile);
          setIsAddingLeader(false);
          setNewLeader({ name: '', role: '', industry: '', email: '', website: '', linkedin: '', description: '', toneStyle: 'Professional', plan: PlanTier.PRO, customerStatus: CustomerStatus.ONBOARDING, expertise: [] });
          loadData();
      }
  };

  const handleAddTeamMember = async () => { 
      if (newTeamMember.name && newTeamMember.email) {
          await db.addTeamMember({ ...newTeamMember, id: `tm-${Date.now()}` } as TeamMember);
          setIsAddingTeamMember(false);
          setNewTeamMember({});
          loadData();
      }
  };

  const handleSaveTeamEdit = async () => {
      if (editingTeamMember) {
          await db.updateStaffProfile(editingTeamMember.id, editingTeamMember);
          setEditingTeamMember(null);
          loadData();
      }
  };
  
  const handleSavePlan = async () => { 
      const p = planModal.data;
      if (p.name && p.price) {
          if (p.id) {
              await db.updatePlan(p.id, p);
          } else {
              await db.addPlan({ 
                  ...p, 
                  id: `pl-${Date.now()}`,
                  subscriberCount: 0,
                  revenue: 0,
                  active: p.active ?? true
              } as SubscriptionPlan);
          }
          setPlanModal({ isOpen: false, data: {} });
          loadData();
      }
  };

  const handleSaveCoupon = async () => { 
      const c = couponModal.data;
      if (c.code && c.discountValue) {
          if (c.id) {
              await db.updateCoupon(c.id, c);
          } else {
              await db.addCoupon({ ...c, id: `cp-${Date.now()}`, active: c.active ?? true } as Coupon);
          }
          setCouponModal({ isOpen: false, data: {} });
          loadData();
      }
  };

  const handleSaveAddOn = async () => {
      const a = addOnModal.data;
      if (a.name && a.price) {
          if (a.id) {
              await db.updateAddOn(a.id, a);
          } else {
              await db.createAddOn({ ...a, id: `addon-${Date.now()}`, selected: false, active: a.active ?? true } as AddOn);
          }
          setAddOnModal({ isOpen: false, data: {} });
          loadData();
      }
  };
  
  const handleUpdateProfile = async () => { 
      if (editedUser && currentUser) {
          await db.updateStaffProfile(currentUser.id, editedUser);
          setCurrentUser({ ...currentUser, ...editedUser });
          setIsEditingProfile(false);
          alert("Profile updated.");
      }
  };
  
  const handleAddWorkflow = async () => { 
      if (newWorkflow.name && newWorkflow.slaHours) {
          await db.addWorkflow({ ...newWorkflow, id: `wf-${Date.now()}` } as WorkflowDefinition);
          setIsAddingWorkflow(false);
          setNewWorkflow({});
          loadData();
      }
  };
  
  const handleGeneratePromptBatch = async () => {
    setIsResearching(true);
    try {
        let activeLeaders = crmUsers.filter(u => u.customerStatus === CustomerStatus.ACTIVE);
        if (currentUser?.role === 'Account Manager') activeLeaders = activeLeaders.filter(u => u.accountManagerId === currentUser.id);
        if (promptFilterLeader !== 'ALL') activeLeaders = activeLeaders.filter(u => u.id === promptFilterLeader);
        
        if (activeLeaders.length === 0) {
            alert("No active leaders found matching criteria.");
            return;
        }
        
        for (const leader of activeLeaders) {
            const frequency = leader.schedule || ScheduleFrequency.DAILY_MON_FRI;
            let batchSize = 1;
            if (frequency === ScheduleFrequency.DAILY_MON_FRI) batchSize = 5;
            else if (frequency === ScheduleFrequency.WEEKENDS) batchSize = 2;
            else if (frequency === ScheduleFrequency.RANDOM_3X) batchSize = 3;
            
            const toneOverride = researchTone === 'Use Profile Default' ? undefined : researchTone;

            for(let i=0; i<batchSize; i++) {
               await geminiService.generateDailyPrompt(leader, undefined, toneOverride, researchFocus);
            }
        }
        await loadData();
        alert(`Research Complete!`);
    } catch (e) {
        console.error("Research failed:", e);
        alert("An error occurred during agent research.");
    } finally {
        setIsResearching(false);
    }
  };

  const handleSchedulePrompt = async (promptId: string, specificDate?: string, immediate = false) => {
    await db.schedulePrompt(promptId, specificDate, immediate);
    setPromptSchedulingId(null);
    loadData();
  };

  const openFutureScheduler = (prompt: DailyPrompt) => {
    const user = crmUsers.find(u => u.id === prompt.userId);
    if (user) {
      const dates = db.getDeliverySchedule(user.schedule);
      setAvailableDates(dates);
      setPromptSchedulingId(prompt.id);
    }
  };
  
  const handleDismissPrompt = async (promptId: string) => {
      const prompt = pendingPrompts.find(p => p.id === promptId);
      if (prompt) {
          const updated = { ...prompt, status: PromptStatus.ARCHIVED };
          db.savePrompt(updated);
          loadData();
      }
  };

  const handleRegeneratePrompt = async (prompt: DailyPrompt) => {
      await handleDismissPrompt(prompt.id);
      const user = crmUsers.find(u => u.id === prompt.userId);
      if (user) {
          setIsResearching(true);
          const toneOverride = researchTone === 'Use Profile Default' ? undefined : researchTone;
          await geminiService.generateDailyPrompt(user, undefined, toneOverride, researchFocus);
          setIsResearching(false);
          loadData();
      }
  };

  const openSubjectDetails = async (user: UserProfile) => {
      setSelectedSubject(user);
      setEditedSubject(user); 
      setIsEditingSubject(false);
      setIsEditingIdentity(false); 
      setLlmInstructions(user.llmInstructions || '');
      const content = await db.getContent();
      setSubjectContent(content.filter(c => c.userId === user.id));
      const allPayments = await db.getClientPayments();
      setSubjectPayments(allPayments.filter(p => p.userId === user.id));
      setActiveSubjectTab('PROFILE');
  };
  
  const handleSaveSubjectProfile = async () => {
      if (selectedSubject && editedSubject) {
          await db.crmUpdateUser(selectedSubject.id, editedSubject);
          setSelectedSubject({ ...selectedSubject, ...editedSubject } as UserProfile);
          setIsEditingSubject(false);
          setIsEditingIdentity(false); 
          loadData();
      }
  };

  const saveSubjectLLM = async () => { 
      if (selectedSubject) {
          await db.crmUpdateUser(selectedSubject.id, { llmInstructions });
          alert("AI Instructions updated.");
          loadData(); 
      }
  };

  const openKanbanItem = (item: ContentItem) => { setSelectedKanbanItem(item); setKanbanMode('CONTENT'); setKanbanModalOpen(true); };
  const openScheduledPrompt = (prompt: DailyPrompt) => { setSelectedPromptItem(prompt); setKanbanMode('PROMPT'); setKanbanModalOpen(true); };
  const handleAssignEditor = async () => { if (selectedKanbanItem && assignEditorId) { await db.assignEditor(selectedKanbanItem.id, assignEditorId); setKanbanModalOpen(false); loadData(); } };
  const handleEditorAccept = async (acc: boolean) => { if (selectedKanbanItem) { await db.editorResponse(selectedKanbanItem.id, acc); setKanbanModalOpen(false); loadData(); } };
  const handleMoveToReview = async () => { if (selectedKanbanItem) { await db.sendToReview(selectedKanbanItem.id); setKanbanModalOpen(false); loadData(); } };
  const handleUpdatePrompt = async () => { 
      if (selectedPromptItem) {
          const updated = { ...selectedPromptItem, question: editPromptText, scheduledFor: editPromptDate };
          db.savePrompt(updated);
          setKanbanModalOpen(false);
          loadData();
      } 
  };

  if (!currentUser) return (
      <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl">
           <OwlLogo size={64} className="mx-auto mb-6" />
           <h1 className="text-2xl font-bold text-slate-900 mb-2">Staff Portal Access</h1>
           <p className="text-slate-500 mb-8">Secure Login</p>
           
           <div className="space-y-4 text-left">
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="name@thoughtvoice.ai" />
              </div>
              <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Password</label>
                  <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="••••••••" />
              </div>
              {loginError && <div className="text-red-500 text-sm font-bold">{loginError}</div>}
              
              <button onClick={handleLogin} className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">Sign In</button>
              <div className="text-center text-xs text-slate-400 mt-4">
                  Default for demo: <br/> alex@thoughtvoice.ai / thoughtvoice
              </div>
           </div>
           <button onClick={() => navigate('/')} className="mt-8 text-sm text-slate-400 hover:text-slate-600">Back to Client App</button>
        </div>
      </div>
  );

  const visibleTabs = getVisibleTabs();
  const openTickets = tickets.filter(t => t.status === 'OPEN');
  const noticeCount = openTickets.length;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
           <OwlLogo size={32} />
           <div><h1 className="font-bold text-slate-900 leading-none">ThoughtVoice Ops</h1><p className="text-xs text-slate-500 mt-1">Production Center</p></div>
        </div>
        <div className="flex items-center gap-6">
           <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {visibleTabs.map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
                      activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 
                      tab.id === 'NOTICES' && noticeCount > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={14} /> 
                  {tab.label}
                  {tab.id === 'NOTICES' && noticeCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{noticeCount}</span>
                  )}
                </button>
              ))}
           </nav>
           <div className="h-6 w-px bg-slate-200"></div>
           <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                 <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
                 <div className="text-[10px] text-slate-500 uppercase">{currentUser.role}</div>
              </div>
              <button onClick={() => setCurrentUser(null)} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Logout">
                 <LogOut size={18} />
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
         {activeTab === 'NOTICES' && (
             <div className="p-8 h-full overflow-y-auto max-w-5xl mx-auto">
                 <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-bold text-slate-900">Support & Notices</h2>
                     <div className="flex items-center gap-2 bg-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600">
                         <Inbox size={16} /> {noticeCount} Active Tickets
                     </div>
                 </div>
                 
                 <div className="space-y-4">
                    {tickets.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-3xl p-20 text-center shadow-sm">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Queue is Clear</h3>
                            <p className="text-slate-500">No pending support requests or automated notices.</p>
                        </div>
                    ) : (
                        tickets.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => openTicket(t)} 
                                className={`bg-white p-5 border rounded-2xl cursor-pointer hover:border-tv-teal transition-all shadow-sm flex items-center justify-between group ${t.status === 'RESOLVED' ? 'opacity-60 grayscale' : ''}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${t.status === 'RESOLVED' ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-500'}`}>
                                        {t.userName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{t.userName}</div>
                                        <div className="text-sm text-slate-500 line-clamp-1">{t.issue}</div>
                                        <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{new Date(t.createdAt).toLocaleDateString()} at {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${t.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {t.status}
                                    </span>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-tv-teal transition-colors" />
                                </div>
                            </div>
                        ))
                    )}
                 </div>
             </div>
         )}

         {activeTab === 'DATABASE' && (
             <div className="p-8 h-full overflow-y-auto max-w-4xl mx-auto">
                 <h2 className="text-2xl font-bold mb-6">Database Config</h2>
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                     <h3 className="font-bold mb-4">Supabase Integration</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">Project URL</label>
                             <input className="w-full p-2 border rounded" placeholder="https://xyz.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-slate-700 mb-1">API Key (Anon/Public)</label>
                             <input className="w-full p-2 border rounded" type="password" placeholder="ey..." value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} />
                         </div>
                         <div className="flex gap-4">
                             <button onClick={handleSaveSupabase} className="px-6 py-2 bg-slate-900 text-white rounded font-bold hover:bg-slate-800">Save Config</button>
                             <button onClick={handleMigrate} disabled={dbMigrationStatus === 'MIGRATING'} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 disabled:opacity-50">
                                 {dbMigrationStatus === 'MIGRATING' ? 'Migrating...' : 'Migrate Data'}
                             </button>
                         </div>
                         {dbMigrationStatus === 'SUCCESS' && <div className="text-green-600 font-bold mt-2">Migration Successful! {migrationCount} records synced.</div>}
                         {dbMigrationStatus === 'ERROR' && <div className="text-red-600 font-bold mt-2">Migration Failed. Check console.</div>}
                     </div>
                 </div>
             </div>
         )}

         {activeTab === 'SUBSCRIPTIONS' && (
             <div className="p-8 h-full overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Plans, Add-ons & Coupons</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setAddOnModal({ isOpen: true, data: { active: true } })} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50"><Plus size={18} /> New Add-on</button>
                        <button onClick={() => setCouponModal({ isOpen: true, data: { active: true } })} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50"><Ticket size={18} /> New Coupon</button>
                        <button onClick={() => setPlanModal({ isOpen: true, data: { frequency: ScheduleFrequency.RANDOM_1X, deliverables: [], activeDays: [], active: true } })} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700"><Plus size={18} /> New Plan</button>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {plans.map(plan => (
                        <div key={plan.id} className={`bg-white p-6 rounded-xl border shadow-sm relative group ${!plan.active ? 'opacity-60 bg-slate-50 grayscale' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{plan.name} (${plan.price})</h3>
                                <button onClick={() => setPlanModal({ isOpen: true, data: plan })} className="p-2 text-slate-400 hover:text-tv-teal hover:bg-teal-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit3 size={16} />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 mb-2">{plan.description}</p>
                            <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-400 font-bold">Max Platforms: {plan.maxPlatforms}</div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${plan.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{plan.active ? 'ACTIVE' : 'DISABLED'}</span>
                            </div>
                        </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                         <h3 className="font-bold text-lg mb-4">Add-Ons</h3>
                         <div className="space-y-3">
                            {addOns.map(addon => (
                                <div key={addon.id} className={`bg-white p-4 border rounded-lg border-l-4 shadow-sm flex justify-between items-center group ${addon.active ? 'border-l-purple-500' : 'border-l-slate-300 opacity-60 grayscale'}`}>
                                    <div>
                                        <div className="font-bold flex items-center gap-2">
                                            {addon.name}
                                            <span className={`text-[10px] font-bold px-1.5 rounded ${addon.active ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{addon.active ? 'ACTIVE' : 'OFF'}</span>
                                        </div>
                                        <div className="text-sm text-slate-500">{addon.description}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-purple-600">${addon.price}</div>
                                        <button onClick={() => setAddOnModal({ isOpen: true, data: addon })} className="p-2 text-slate-400 hover:text-tv-teal opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit3 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                         </div>
                     </div>
                     <div>
                         <h3 className="font-bold text-lg mb-4">Active Coupons</h3>
                         <div className="space-y-3">
                            {coupons.map(coupon => (
                                <div key={coupon.id} className={`bg-white p-4 border rounded-lg border-l-4 shadow-sm flex justify-between items-center group ${coupon.active ? 'border-l-green-500' : 'border-l-slate-300 opacity-60 grayscale'}`}>
                                    <div>
                                        <div className="font-bold font-mono flex items-center gap-2">
                                            {coupon.code}
                                            <span className={`text-[10px] font-bold px-1.5 rounded ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{coupon.active ? 'ACTIVE' : 'EXPIRED'}</span>
                                        </div>
                                        <div className="text-sm text-slate-500">{coupon.discountType === 'PERCENT' ? `${coupon.discountValue}% OFF` : `$${coupon.discountValue} OFF`}</div>
                                    </div>
                                    <button onClick={() => setCouponModal({ isOpen: true, data: coupon })} className="p-2 text-slate-400 hover:text-tv-teal opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                            ))}
                         </div>
                     </div>
                 </div>
                 
                 {planModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl max-w-md w-full shadow-2xl animate-fade-in-up">
                            <h3 className="font-bold text-xl mb-4">{planModal.data.id ? 'Edit Plan' : 'New Subscription Plan'}</h3>
                            <div className="space-y-3 mb-6">
                                <input className="w-full p-2 border rounded" placeholder="Plan Name" value={planModal.data.name || ''} onChange={e => setPlanModal({...planModal, data: {...planModal.data, name: e.target.value}})} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className="w-full p-2 border rounded" placeholder="Price ($)" type="number" value={planModal.data.price || ''} onChange={e => setPlanModal({...planModal, data: {...planModal.data, price: parseFloat(e.target.value)}})} />
                                    <input className="w-full p-2 border rounded" placeholder="Max Platforms" type="number" value={planModal.data.maxPlatforms || ''} onChange={e => setPlanModal({...planModal, data: {...planModal.data, maxPlatforms: parseInt(e.target.value)}})} />
                                </div>
                                <select className="w-full p-2 border rounded" value={planModal.data.frequency} onChange={e => setPlanModal({...planModal, data: {...planModal.data, frequency: e.target.value as any}})}>
                                    <option value={ScheduleFrequency.DAILY_MON_FRI}>Daily (Mon-Fri)</option>
                                    <option value={ScheduleFrequency.WEEKENDS}>Weekends</option>
                                    <option value={ScheduleFrequency.RANDOM_3X}>3x Weekly</option>
                                    <option value={ScheduleFrequency.RANDOM_2X}>2x Weekly</option>
                                    <option value={ScheduleFrequency.RANDOM_1X}>1x Weekly</option>
                                </select>
                                <textarea className="w-full p-2 border rounded" placeholder="Description" rows={2} value={planModal.data.description || ''} onChange={e => setPlanModal({...planModal, data: {...planModal.data, description: e.target.value}})} />
                                <input className="w-full p-2 border rounded" placeholder="Deliverables (comma separated)" value={planModal.data.deliverables?.join(', ') || ''} onChange={e => setPlanModal({...planModal, data: {...planModal.data, deliverables: e.target.value.split(',').map(s => s.trim())}})} />
                                
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                    <span className="text-sm font-bold text-slate-700">Plan Status</span>
                                    <button onClick={() => setPlanModal({...planModal, data: {...planModal.data, active: !planModal.data.active}})} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${planModal.data.active ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                        {planModal.data.active ? <><ToggleRight size={16} /> ACTIVE</> : <><ToggleLeft size={16} /> DISABLED</>}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => setPlanModal({ isOpen: false, data: {} })} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold">Cancel</button>
                                <button onClick={handleSavePlan} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800">Save Plan</button>
                            </div>
                        </div>
                    </div>
                 )}

                 {addOnModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl max-w-sm w-full shadow-2xl animate-fade-in-up">
                            <h3 className="font-bold text-xl mb-4">{addOnModal.data.id ? 'Edit Add-on' : 'New Add-on'}</h3>
                            <div className="space-y-3 mb-6">
                                <input className="w-full p-2 border rounded" placeholder="Name" value={addOnModal.data.name || ''} onChange={e => setAddOnModal({...addOnModal, data: {...addOnModal.data, name: e.target.value}})} />
                                <input className="w-full p-2 border rounded" placeholder="Price" type="number" value={addOnModal.data.price || ''} onChange={e => setAddOnModal({...addOnModal, data: {...addOnModal.data, price: parseFloat(e.target.value)}})} />
                                <input className="w-full p-2 border rounded" placeholder="Description" value={addOnModal.data.description || ''} onChange={e => setAddOnModal({...addOnModal, data: {...addOnModal.data, description: e.target.value}})} />
                                
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                    <span className="text-sm font-bold text-slate-700">Available to Clients</span>
                                    <button onClick={() => setAddOnModal({...addOnModal, data: {...addOnModal.data, active: !addOnModal.data.active}})} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${addOnModal.data.active ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                        {addOnModal.data.active ? <><ToggleRight size={16} /> ENABLED</> : <><ToggleLeft size={16} /> DISABLED</>}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setAddOnModal({ isOpen: false, data: {} })} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                                <button onClick={handleSaveAddOn} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800">Save Add-on</button>
                            </div>
                        </div>
                    </div>
                 )}

                 {couponModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl max-w-sm w-full shadow-2xl animate-fade-in-up">
                            <h3 className="font-bold text-xl mb-4">{couponModal.data.id ? 'Edit Coupon' : 'New Coupon'}</h3>
                            <div className="space-y-3 mb-6">
                                <input className="w-full p-2 border rounded uppercase font-mono" placeholder="CODE (e.g. SAVE20)" value={couponModal.data.code || ''} onChange={e => setCouponModal({...couponModal, data: {...couponModal.data, code: e.target.value.toUpperCase()}})} />
                                <select className="w-full p-2 border rounded" value={couponModal.data.discountType} onChange={(e) => setCouponModal({...couponModal, data: {...couponModal.data, discountType: e.target.value as any}})}>
                                    <option value="PERCENT">Percentage Off (%)</option>
                                    <option value="FIXED">Fixed Amount Off ($)</option>
                                </select>
                                <input className="w-full p-2 border rounded" placeholder="Value" type="number" value={couponModal.data.discountValue || ''} onChange={e => setCouponModal({...couponModal, data: {...couponModal.data, discountValue: parseFloat(e.target.value)}})} />
                                
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                    <span className="text-sm font-bold text-slate-700">Coupon Status</span>
                                    <button onClick={() => setCouponModal({...couponModal, data: {...couponModal.data, active: !couponModal.data.active}})} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${couponModal.data.active ? 'bg-green-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                        {couponModal.data.active ? <><ToggleRight size={16} /> ACTIVE</> : <><ToggleLeft size={16} /> DISABLED</>}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCouponModal({ isOpen: false, data: {} })} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                                <button onClick={handleSaveCoupon} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800">Save Coupon</button>
                            </div>
                        </div>
                    </div>
                 )}
             </div>
         )}

         {activeTab === 'WORKFLOWS' && (
             <div className="p-8 h-full overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold">SLA & Workflows</h2>
                     <button onClick={() => setIsAddingWorkflow(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700">
                         <Plus size={18} /> New Workflow
                     </button>
                 </div>
                 <div className="space-y-2">
                     {workflows.map(wf => (
                         <div key={wf.id} className="bg-white p-4 border rounded shadow-sm flex justify-between items-center">
                             <div>
                                 <div className="font-bold text-lg">{wf.name}</div>
                                 <div className="text-xs text-slate-500 uppercase">{wf.type} Tier</div>
                             </div>
                             <div className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded">{wf.slaHours} Hours SLA</div>
                         </div>
                     ))}
                 </div>

                 {isAddingWorkflow && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-xl max-w-sm w-full">
                            <h3 className="font-bold text-xl mb-4">New Workflow</h3>
                            <input className="w-full p-2 border rounded mb-2" placeholder="Name (e.g. Rush Edit)" value={newWorkflow.name} onChange={e => setNewWorkflow({...newWorkflow, name: e.target.value})} />
                            <input className="w-full p-2 border rounded mb-2" placeholder="SLA (Hours)" type="number" value={newWorkflow.slaHours || ''} onChange={e => setNewWorkflow({...newWorkflow, slaHours: parseFloat(e.target.value)})} />
                            <select className="w-full p-2 border rounded mb-4" value={newWorkflow.type} onChange={(e) => setNewWorkflow({...newWorkflow, type: e.target.value as any})}>
                                <option value="STANDARD">Standard</option>
                                <option value="RUSH">Rush</option>
                                <option value="COMPLEX">Complex</option>
                            </select>
                            <div className="flex gap-2">
                                <button onClick={() => setIsAddingWorkflow(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                                <button onClick={handleAddWorkflow} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold">Create</button>
                            </div>
                        </div>
                    </div>
                 )}
             </div>
         )}

         {activeTab === 'PROMPTS' && (
            <div className="p-8 h-full flex flex-col relative">
               <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-4 flex-wrap">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Leader</label>
                           <select 
                               value={promptFilterLeader} 
                               onChange={(e) => setPromptFilterLeader(e.target.value)}
                               className="p-2 border rounded-lg text-sm min-w-[200px]"
                           >
                               <option value="ALL">All Leaders</option>
                               {crmUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Research Focus</label>
                           <select 
                               value={researchFocus}
                               onChange={(e) => setResearchFocus(e.target.value)}
                               className="p-2 border rounded-lg text-sm min-w-[180px]"
                           >
                               <option>Strategic</option>
                               <option>Trending</option>
                               <option>Competitor Gap</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tone</label>
                           <select 
                               value={researchTone}
                               onChange={(e) => setResearchTone(e.target.value)}
                               className="p-2 border rounded-lg text-sm min-w-[150px]"
                           >
                               <option>Use Profile Default</option>
                               <option>Controversial</option>
                               <option>Educational</option>
                               <option>Empathetic</option>
                               <option>Authoritative</option>
                           </select>
                       </div>
                   </div>
                   <button 
                       onClick={handleGeneratePromptBatch} 
                       disabled={isResearching}
                       className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700 disabled:opacity-50"
                   >
                       {isResearching ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                       Run Agent Research
                   </button>
               </div>

               <div className="flex-1 overflow-y-auto">
                  {Object.entries(groupedPrompts)
                      .filter(([uid]) => promptFilterLeader === 'ALL' || uid === promptFilterLeader)
                      .map(([userId, promptsRaw]) => {
                          const prompts = promptsRaw as DailyPrompt[]; 
                          const user = crmUsers.find(u => u.id === userId);
                          if (!user) return null;
                          return (
                              <div key={userId} className="mb-10">
                                  <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-200">
                                      {user.brandLogoUrl ? <img src={user.brandLogoUrl} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold">{user.name.charAt(0)}</div>}
                                      <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
                                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{prompts.length} Pending</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                      {prompts.map(p => (
                                          <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                                              <div className="flex justify-between items-start mb-3">
                                                  <span className="text-xs font-bold text-tv-teal uppercase tracking-wider bg-teal-50 px-2 py-1 rounded">Generated Idea</span>
                                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button onClick={() => handleRegeneratePrompt(p)} title="Regenerate" className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold flex items-center gap-1 hover:bg-blue-100"><RefreshCw size={12} /> Regenerate</button>
                                                      <button onClick={() => handleDismissPrompt(p.id)} title="Dismiss" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><X size={14} /></button>
                                                  </div>
                                              </div>
                                              
                                              <h4 className="font-bold text-slate-800 mb-2 leading-snug">"{p.question}"</h4>
                                              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.reasoning}</p>
                                              
                                              <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-2 rounded text-xs">
                                                  <div>
                                                      <span className="font-bold text-slate-400 block mb-1 uppercase text-[10px]">Video Angle</span>
                                                      <span className="text-slate-700">{p.angleVideo || 'N/A'}</span>
                                                  </div>
                                                  <div>
                                                      <span className="font-bold text-slate-400 block mb-1 uppercase text-[10px]">Post Angle</span>
                                                      <span className="text-slate-700">{p.anglePost || 'N/A'}</span>
                                                  </div>
                                              </div>
                                              
                                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                                  <div className="flex -space-x-2">
                                                  </div>
                                                  <button 
                                                      onClick={() => openFutureScheduler(p)}
                                                      className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2"
                                                  >
                                                      <CalendarPlus size={16} /> Schedule
                                                  </button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  
                  {Object.keys(groupedPrompts).length === 0 && (
                      <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                          <Lightbulb size={48} className="mx-auto text-slate-300 mb-4" />
                          <h3 className="text-lg font-bold text-slate-500">Queue Empty</h3>
                          <p className="text-slate-400">Select a leader and run research to generate new prompts.</p>
                      </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'QUEUE' && (
             <div className="p-6 h-full flex flex-col overflow-hidden">
                 <h2 className="text-2xl font-bold mb-4">Production Kanban</h2>
                 <div className="flex-1 grid grid-cols-5 gap-4 overflow-hidden h-full pb-4 min-w-[1000px]">
                    {/* Column 1: Scheduled */}
                    <div className="flex flex-col bg-slate-100/50 rounded-xl border border-slate-200 h-full overflow-hidden">
                        <div className="p-3 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
                            <span className="flex items-center gap-2"><Calendar size={14} /> Scheduled</span>
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs">{scheduledPrompts.length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 space-y-2">
                             {scheduledPrompts.map(prompt => {
                                 const leader = crmUsers.find(u => u.id === prompt.userId);
                                 return (
                                     <div key={prompt.id} onClick={() => openScheduledPrompt(prompt)} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                         <div className="font-bold text-sm text-slate-900 leading-tight mb-1">{leader?.name}</div>
                                         <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><CalendarDays size={10} /> {new Date(prompt.scheduledFor).toLocaleDateString()}</div>
                                         <div className="text-[10px] text-slate-400 truncate">"{prompt.question}"</div>
                                     </div>
                                 )
                             })}
                        </div>
                    </div>

                    {/* Column 2: Captured */}
                    <div className="flex flex-col bg-orange-50/50 rounded-xl border border-orange-100 h-full overflow-hidden">
                        <div className="p-3 border-b border-orange-100 bg-orange-50 font-bold text-orange-800 flex justify-between items-center">
                            <span className="flex items-center gap-2"><UploadCloud size={14} /> Captured</span>
                            <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded text-xs">{queue.filter(i => i.status === ContentStatus.SUBMITTED_TO_EDITORS).length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 space-y-2">
                             {queue.filter(i => i.status === ContentStatus.SUBMITTED_TO_EDITORS).map(item => (
                                 <div key={item.id} onClick={() => openKanbanItem(item)} className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                     <div className="flex justify-between items-start mb-2">
                                         <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === 'VIDEO' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{item.type}</span>
                                     </div>
                                     <div className="font-bold text-sm text-slate-900 leading-tight mb-1">{crmUsers.find(u => u.id === item.userId)?.name}</div>
                                     <div className="text-xs text-slate-500 mb-2">{new Date(item.createdAt).toLocaleDateString()}</div>
                                     <div className="text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded inline-block">Assign Editor</div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Column 3: Editing */}
                    <div className="flex flex-col bg-blue-50/50 rounded-xl border border-blue-100 h-full overflow-hidden">
                        <div className="p-3 border-b border-blue-100 bg-blue-50 font-bold text-blue-800 flex justify-between items-center">
                            <span className="flex items-center gap-2"><Edit3 size={14} /> Editing</span>
                            <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs">{queue.filter(i => i.status === ContentStatus.EDITING_IN_PROGRESS).length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 space-y-2">
                             {queue.filter(i => i.status === ContentStatus.EDITING_IN_PROGRESS).map(item => {
                                 const editor = teamMembers.find(t => t.id === item.assignedTo);
                                 return (
                                     <div key={item.id} onClick={() => openKanbanItem(item)} className={`bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer ${item.editorStatus === 'REJECTED' ? 'border-red-200 bg-red-50' : 'border-blue-100'}`}>
                                         <div className="flex justify-between items-start mb-2">
                                             <div className="font-bold text-sm text-slate-900 leading-tight">{crmUsers.find(u => u.id === item.userId)?.name}</div>
                                             {item.editorStatus === 'ACCEPTED' ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : 
                                              item.editorStatus === 'REJECTED' ? <div className="w-2 h-2 rounded-full bg-red-500"></div> :
                                              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>}
                                         </div>
                                         <div className="text-xs text-slate-500 mb-2 flex items-center gap-1"><UserCog size={10} /> {editor?.name || 'Unassigned'}</div>
                                         <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                                     </div>
                                 )
                             })}
                        </div>
                    </div>

                    {/* Column 4: Review */}
                    <div className="flex flex-col bg-purple-50/50 rounded-xl border border-purple-100 h-full overflow-hidden">
                        <div className="p-3 border-b border-purple-100 bg-purple-50 font-bold text-purple-800 flex justify-between items-center">
                            <span className="flex items-center gap-2"><Eye size={14} /> Review</span>
                            <span className="bg-purple-200 text-purple-800 px-2 py-0.5 rounded text-xs">{queue.filter(i => i.status === ContentStatus.READY_FOR_REVIEW).length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 space-y-2">
                             {queue.filter(i => i.status === ContentStatus.READY_FOR_REVIEW).map(item => (
                                 <div key={item.id} onClick={() => openKanbanItem(item)} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer opacity-90">
                                     <div className="font-bold text-sm text-slate-900 leading-tight mb-1">{crmUsers.find(u => u.id === item.userId)?.name}</div>
                                     <div className="text-xs text-slate-500 mb-2">{new Date(item.createdAt).toLocaleDateString()}</div>
                                     <div className="flex items-center gap-2 mt-2">
                                         <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-purple-500 w-2/3"></div>
                                         </div>
                                         <span className="text-[10px] text-purple-600 font-bold">In Review</span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Column 5: Publish */}
                    <div className="flex flex-col bg-green-50/50 rounded-xl border border-green-100 h-full overflow-hidden">
                        <div className="p-3 border-b border-green-100 bg-green-50 font-bold text-green-800 flex justify-between items-center">
                            <span className="flex items-center gap-2"><Send size={14} /> Publish</span>
                            <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs">{queue.filter(i => i.status === ContentStatus.APPROVED || i.status === ContentStatus.PUBLISHED).length}</span>
                        </div>
                        <div className="p-2 overflow-y-auto flex-1 space-y-2">
                             {queue.filter(i => i.status === ContentStatus.APPROVED || i.status === ContentStatus.PUBLISHED).map(item => (
                                 <div key={item.id} onClick={() => openKanbanItem(item)} className="bg-white p-3 rounded-lg border border-green-100 shadow-sm cursor-pointer hover:shadow-md transition-all">
                                     <div className="flex justify-between items-start mb-2">
                                         <div className="font-bold text-sm text-slate-900 leading-tight">{crmUsers.find(u => u.id === item.userId)?.name}</div>
                                         <CheckCircle size={14} className="text-green-500" />
                                     </div>
                                     <div className="text-xs text-slate-500 mb-2">{new Date(item.createdAt).toLocaleDateString()}</div>
                                 </div>
                             ))}
                        </div>
                    </div>
                 </div>
             </div>
         )}

         {activeTab === 'REPORTS' && crmReport && (
            <div className="p-8 h-full overflow-y-auto">
               <h2 className="text-2xl font-bold mb-6">Reports & Analytics</h2>
               
               {productionReport && (
                   <div className="mb-12">
                       <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Timer size={20} /> Production Performance</h3>
                       
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Videos Delivered (MTD)</div>
                               <div className="flex items-end gap-2">
                                   <span className="text-3xl font-bold text-slate-900">{productionReport.mtd.count}</span>
                                   <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${productionReport.mtd.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                       {productionReport.mtd.growth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                       {Math.abs(Math.round(productionReport.mtd.growth))}%
                                   </div>
                               </div>
                               <div className="text-[10px] text-slate-400 mt-2">vs. Previous Month</div>
                           </div>

                           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Videos Delivered (QTD)</div>
                               <div className="flex items-end gap-2">
                                   <span className="text-3xl font-bold text-slate-900">{productionReport.qtd.count}</span>
                                   <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${productionReport.qtd.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                       {productionReport.qtd.growth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                       {Math.abs(Math.round(productionReport.qtd.growth))}%
                                   </div>
                               </div>
                               <div className="text-[10px] text-slate-400 mt-2">vs. Previous Quarter</div>
                           </div>

                           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Videos Delivered (YTD)</div>
                               <div className="flex items-end gap-2">
                                   <span className="text-3xl font-bold text-slate-900">{productionReport.ytd.count}</span>
                                   <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${productionReport.ytd.growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                       {productionReport.ytd.growth >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                                       {Math.abs(Math.round(productionReport.ytd.growth))}%
                                   </div>
                               </div>
                               <div className="text-[10px] text-slate-400 mt-2">vs. Previous Year</div>
                           </div>

                           <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg text-white">
                               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Turnaround Time</div>
                               <div className="flex items-end gap-2">
                                   <span className="text-3xl font-bold text-white">{productionReport.avgCycleHours.toFixed(1)}h</span>
                                   <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full mb-1 ${productionReport.avgCycleGrowth < 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                       {productionReport.avgCycleGrowth < 0 ? <TrendingDown size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1" />}
                                       {Math.abs(productionReport.avgCycleGrowth)}%
                                   </div>
                               </div>
                               <div className="text-[10px] text-slate-400 mt-2">Prompt Sent → Published</div>
                           </div>
                       </div>

                       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                           <h4 className="text-sm font-bold text-slate-900 mb-6">Average Time Spent per Stage</h4>
                           <div className="space-y-6">
                               <div className="flex h-4 rounded-full overflow-hidden w-full bg-slate-100">
                                   {productionReport.stageBreakdown.map((stage, idx) => {
                                       const totalHours = productionReport.stageBreakdown.reduce((acc, s) => acc + s.hours, 0);
                                       const width = (stage.hours / totalHours) * 100;
                                       return (
                                           <div 
                                               key={idx} 
                                               style={{ width: `${width}%`, backgroundColor: stage.color }} 
                                               className="h-full transition-all duration-500 hover:opacity-80"
                                               title={`${stage.stage}: ${stage.hours}h`}
                                           ></div>
                                       );
                                   })}
                               </div>
                               
                               <div className="grid grid-cols-4 gap-4">
                                   {productionReport.stageBreakdown.map((stage, idx) => (
                                       <div key={idx} className="text-center p-3 rounded-lg border border-slate-50 bg-slate-50/50">
                                           <div className="flex items-center justify-center gap-2 mb-1">
                                               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }}></div>
                                               <span className="text-xs font-bold text-slate-500 uppercase">{stage.stage}</span>
                                           </div>
                                           <div className="text-xl font-bold text-slate-800">{stage.hours}h</div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       </div>
                   </div>
               )}

               <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><DollarSign size={20} /> Financial Insights</h3>
               <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <div className="text-sm text-slate-500 uppercase font-bold mb-2">Total Revenue</div>
                      <div className="text-3xl font-bold text-slate-900">${crmReport.totalRevenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <div className="text-sm text-slate-500 uppercase font-bold mb-2">Net Profit</div>
                      <div className="text-3xl font-bold text-green-600">${crmReport.netProfit.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <div className="text-sm text-slate-500 uppercase font-bold mb-2">Active Projects</div>
                      <div className="text-3xl font-bold text-blue-600">{crmReport.activeProjects}</div>
                  </div>
                  <div className="bg-white p-6 border rounded-xl shadow-sm">
                      <div className="text-sm text-slate-500 uppercase font-bold mb-2">Weekly Velocity</div>
                      <div className="text-3xl font-bold text-slate-900">{crmReport.contentVelocity} <span className="text-sm font-normal text-slate-400">items</span></div>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-8">
                   <div className="bg-white p-6 border rounded-xl shadow-sm">
                       <h3 className="font-bold text-lg mb-4">Cost Breakdown</h3>
                       <div className="space-y-4">
                           <div className="flex justify-between items-center">
                               <span>Contractor Payments</span>
                               <span className="font-bold">${crmReport.contractorCost.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span>W2 Estimates</span>
                               <span className="font-bold">${crmReport.w2CostEstimates.toLocaleString()}</span>
                           </div>
                       </div>
                   </div>
                   <div className="bg-white p-6 border rounded-xl shadow-sm">
                       <h3 className="font-bold text-lg mb-4">Operational Bottlenecks</h3>
                       {crmReport.bottlenecks.length > 0 ? (
                           <ul className="list-disc list-inside text-red-600 font-medium">
                               {crmReport.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}
                           </ul>
                       ) : (
                           <div className="text-green-600 font-medium flex items-center gap-2"><CheckCircle size={20} /> Operations Healthy</div>
                       )}
                   </div>
               </div>
            </div>
         )}

         {activeTab === 'TEAM' && (
            <div className="p-8 h-full overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold">Team Management</h2>
                   <button onClick={() => setIsAddingTeamMember(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700">
                       <UserPlus size={18} /> Add Team Member
                   </button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                   {teamMembers.map(m => (
                       <div key={m.id} onClick={() => setEditingTeamMember(m)} className="bg-white p-6 border rounded-xl shadow-sm cursor-pointer hover:border-tv-teal transition-all group">
                           <div className="flex items-center gap-4 mb-4">
                               <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold group-hover:bg-teal-50 group-hover:text-tv-teal transition-colors">{m.avatar}</div>
                               <div>
                                   <div className="font-bold text-lg">{m.name}</div>
                                   <div className="text-sm text-slate-500">{m.role}</div>
                               </div>
                           </div>
                           <div className="space-y-2 text-sm text-slate-600">
                               <div className="flex justify-between"><span>Status</span> <span className={`font-bold ${m.status === 'AVAILABLE' ? 'text-green-600' : 'text-yellow-600'}`}>{m.status}</span></div>
                               <div className="flex justify-between"><span>Type</span> <span>{m.employmentType}</span></div>
                               <div className="flex justify-between"><span>Rate</span> <span>${m.hourlyRate}/hr</span></div>
                               <div className="flex justify-between"><span>Load</span> <span>{m.currentLoad} tasks</span></div>
                           </div>
                       </div>
                   ))}
               </div>
               
               {isAddingTeamMember && (
                   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                       <div className="bg-white p-8 rounded-xl max-w-sm w-full">
                           <h3 className="font-bold text-xl mb-4">Add Team Member</h3>
                           <input className="w-full p-2 border rounded mb-2" placeholder="Full Name" value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} />
                           <input className="w-full p-2 border rounded mb-2" placeholder="Email" value={newTeamMember.email} onChange={e => setNewTeamMember({...newTeamMember, email: e.target.value})} />
                           <select className="w-full p-2 border rounded mb-2" value={newTeamMember.role} onChange={e => setNewTeamMember({...newTeamMember, role: e.target.value as any})}>
                               <option value="Editor">Editor</option>
                               <option value="Account Manager">Account Manager</option>
                               <option value="Strategist">Strategist</option>
                               <option value="Manager">Manager</option>
                           </select>
                           <input className="w-full p-2 border rounded mb-2" placeholder="Hourly Rate ($)" type="number" value={newTeamMember.hourlyRate || ''} onChange={e => setNewTeamMember({...newTeamMember, hourlyRate: parseFloat(e.target.value)})} />
                           <select className="w-full p-2 border rounded mb-4" value={newTeamMember.employmentType} onChange={e => setNewTeamMember({...newTeamMember, employmentType: e.target.value as any})}>
                               <option value="1099">Contractor (1099)</option>
                               <option value="W2">Employee (W2)</option>
                           </select>
                           <div className="flex gap-2">
                               <button onClick={() => setIsAddingTeamMember(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                               <button onClick={handleAddTeamMember} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold">Add Member</button>
                           </div>
                       </div>
                   </div>
               )}

               {editingTeamMember && (
                   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                       <div className="bg-white p-8 rounded-xl max-w-sm w-full">
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="font-bold text-xl">Edit Team Member</h3>
                               <button onClick={() => setEditingTeamMember(null)} className="p-1 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                           </div>
                           <div className="space-y-3">
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                   <input className="w-full p-2 border rounded" value={editingTeamMember.name} onChange={e => setEditingTeamMember({...editingTeamMember, name: e.target.value})} />
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                   <input className="w-full p-2 border rounded" value={editingTeamMember.email} onChange={e => setEditingTeamMember({...editingTeamMember, email: e.target.value})} />
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                       <select className="w-full p-2 border rounded" value={editingTeamMember.role} onChange={e => setEditingTeamMember({...editingTeamMember, role: e.target.value as any})}>
                                           <option value="Editor">Editor</option>
                                           <option value="Account Manager">Account Manager</option>
                                           <option value="Strategist">Strategist</option>
                                           <option value="Manager">Manager</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                       <select className="w-full p-2 border rounded" value={editingTeamMember.status} onChange={e => setEditingTeamMember({...editingTeamMember, status: e.target.value as any})}>
                                           <option value="AVAILABLE">Available</option>
                                           <option value="BUSY">Busy</option>
                                           <option value="OFFLINE">Offline</option>
                                       </select>
                                   </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                       <select className="w-full p-2 border rounded" value={editingTeamMember.employmentType} onChange={e => setEditingTeamMember({...editingTeamMember, employmentType: e.target.value as any})}>
                                           <option value="1099">1099</option>
                                           <option value="W2">W2</option>
                                       </select>
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-slate-500 mb-1">Rate ($/hr)</label>
                                       <input className="w-full p-2 border rounded" type="number" value={editingTeamMember.hourlyRate} onChange={e => setEditingTeamMember({...editingTeamMember, hourlyRate: parseFloat(e.target.value)})} />
                                   </div>
                               </div>
                               <div>
                                   <label className="block text-xs font-bold text-slate-500 mb-1">Current Load</label>
                                   <input className="w-full p-2 border rounded" type="number" value={editingTeamMember.currentLoad} onChange={e => setEditingTeamMember({...editingTeamMember, currentLoad: parseFloat(e.target.value)})} />
                               </div>
                           </div>
                           <div className="flex gap-2 mt-6">
                               <button onClick={() => setEditingTeamMember(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-50 rounded font-bold">Cancel</button>
                               <button onClick={handleSaveTeamEdit} className="flex-1 bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-700">Save Changes</button>
                           </div>
                       </div>
                   </div>
               )}
            </div>
         )}

         {activeTab === 'ACCOUNTING' && (
            <div className="p-8 h-full overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold">Accounting & Finance</h2>
                   <button onClick={handleRunBilling} disabled={billingProcessing} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50">
                       {billingProcessing ? <Loader2 className="animate-spin" /> : <DollarSign size={18} />} Run Monthly Billing
                   </button>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div>
                       <h3 className="font-bold text-lg mb-4">Client Transaction History</h3>
                       <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-slate-50 text-slate-500">
                                   <tr>
                                       <th className="p-3">Date</th>
                                       <th className="p-3">Client</th>
                                       <th className="p-3">Amount</th>
                                       <th className="p-3 text-right">Status</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {clientPayments.map(p => {
                                       const user = crmUsers.find(u => u.id === p.userId);
                                       return (
                                           <tr key={p.id} className="hover:bg-slate-50">
                                               <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                                               <td className="p-3 font-medium">{user?.name || 'Unknown'}</td>
                                               <td className="p-3">${p.amount}</td>
                                               <td className="p-3 text-right">
                                                   <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span>
                                               </td>
                                           </tr>
                                       )
                                   })}
                               </tbody>
                           </table>
                       </div>
                   </div>
                   
                   <div>
                       <h3 className="font-bold text-lg mb-4">Staff Invoices</h3>
                       <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                           <table className="w-full text-sm text-left">
                               <thead className="bg-slate-50 text-slate-500">
                                   <tr>
                                       <th className="p-3">Date</th>
                                       <th className="p-3">Staff</th>
                                       <th className="p-3">Amount</th>
                                       <th className="p-3 text-right">Status</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {invoices.map(inv => {
                                       const staff = teamMembers.find(t => t.id === inv.staffId);
                                       return (
                                           <tr key={inv.id} className="hover:bg-slate-50">
                                               <td className="p-3">{new Date(inv.date).toLocaleDateString()}</td>
                                               <td className="p-3 font-medium">{staff?.name || 'Unknown'}</td>
                                               <td className="p-3">${inv.amount}</td>
                                               <td className="p-3 text-right">
                                                   <span className={`px-2 py-1 rounded text-[10px] font-bold ${inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span>
                                               </td>
                                           </tr>
                                       )
                                   })}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </div>
            </div>
         )}

         {activeTab === 'MY_PROFILE' && (
             <div className="p-8 h-full overflow-y-auto max-w-2xl mx-auto">
                 <h2 className="text-2xl font-bold mb-6">My Settings</h2>
                 <div className="bg-white p-8 rounded-xl border shadow-sm">
                     <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-100">
                         <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl">{currentUser.avatar}</div>
                         <div>
                             <h3 className="text-2xl font-bold">{currentUser.name}</h3>
                             <p className="text-slate-500">{currentUser.role}</p>
                         </div>
                         {!isEditingProfile && (
                             <button onClick={() => { setIsEditingProfile(true); setEditedUser(currentUser); }} className="ml-auto text-sm font-bold text-indigo-600 hover:underline">Edit Profile</button>
                         )}
                     </div>
                     
                     {isEditingProfile ? (
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                                 <input className="w-full p-3 border rounded-lg" value={editedUser.name} onChange={e => setEditedUser({...editedUser, name: e.target.value})} />
                             </div>
                             <div>
                                 <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                                 <input className="w-full p-3 border rounded-lg" value={editedUser.email} onChange={e => setEditedUser({...editedUser, email: e.target.value})} />
                             </div>
                             <div className="flex gap-4 mt-6">
                                 <button onClick={() => setIsEditingProfile(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                                 <button onClick={handleUpdateProfile} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800">Save Changes</button>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-4 text-sm">
                             <div className="flex justify-between border-b pb-2">
                                 <span className="text-slate-500">Email</span>
                                 <span className="font-medium">{currentUser.email}</span>
                             </div>
                             <div className="flex justify-between border-b pb-2">
                                 <span className="text-slate-500">Employment Type</span>
                                 <span className="font-medium">{currentUser.employmentType}</span>
                             </div>
                             <div className="flex justify-between">
                                 <span className="text-slate-500">Hourly Rate</span>
                                 <span className="font-medium">${currentUser.hourlyRate}/hr</span>
                             </div>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {activeTab === 'CRM' && (
             <div className="p-8 h-full overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-slate-900">Leader CRM</h2>
                     <button onClick={() => setIsAddingLeader(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-700">
                         <UserPlus size={18} /> Add New Leader
                     </button>
                 </div>
                 <div className="bg-white rounded-xl border overflow-hidden">
                     {crmUsers.map(user => (
                         <div key={user.id} onClick={() => openSubjectDetails(user)} className="p-4 border-b hover:bg-slate-50 cursor-pointer flex justify-between">
                             <div className="flex items-center gap-3">
                                 {user.brandLogoUrl ? <img src={user.brandLogoUrl} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>}
                                 <div>
                                     <div className="font-bold">{user.name}</div>
                                     <div className="text-xs text-slate-500">{user.role}, {user.industry}</div>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <div className="font-bold text-sm">{user.plan}</div>
                                 <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${user.customerStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{user.customerStatus}</div>
                             </div>
                         </div>
                     ))}
                 </div>
                 
                 {isAddingLeader && (
                     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                         <div className="bg-white p-8 rounded-2xl max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
                             <h3 className="text-2xl font-bold mb-6 text-slate-900">Add New Leader</h3>
                             <div className="space-y-6">
                                 <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Core Identity</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Full Name" value={newLeader.name} onChange={e => setNewLeader({...newLeader, name: e.target.value})} />
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Email" value={newLeader.email} onChange={e => setNewLeader({...newLeader, email: e.target.value})} />
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Professional Role (e.g. CEO)" value={newLeader.role} onChange={e => setNewLeader({...newLeader, role: e.target.value})} />
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Industry" value={newLeader.industry} onChange={e => setNewLeader({...newLeader, industry: e.target.value})} />
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Phone Number (Optional)" value={newLeader.phone} onChange={e => setNewLeader({...newLeader, phone: e.target.value})} />
                                        <select className="w-full p-3 border rounded-lg bg-slate-50 text-sm" value={newLeader.plan} onChange={e => setNewLeader({...newLeader, plan: e.target.value as PlanTier})}>
                                            <option value={PlanTier.PRO}>Pro Authority ($999)</option>
                                            <option value={PlanTier.ENTERPRISE}>Enterprise Scale ($2,499)</option>
                                            <option value={PlanTier.STARTER}>Executive Starter ($499)</option>
                                        </select>
                                    </div>
                                 </div>
                                 
                                 <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Strategic Profile</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="LinkedIn URL" value={newLeader.linkedin} onChange={e => setNewLeader({...newLeader, linkedin: e.target.value})} />
                                        <input className="w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Company Website" value={newLeader.website} onChange={e => setNewLeader({...newLeader, website: e.target.value})} />
                                        <div className="col-span-2">
                                            <select className="w-full p-3 border rounded-lg bg-slate-50 text-sm" value={newLeader.toneStyle} onChange={e => setNewLeader({...newLeader, toneStyle: e.target.value})}>
                                                <option>Professional</option>
                                                <option>Casual</option>
                                                <option>Authoritative</option>
                                                <option>Empathetic</option>
                                                <option>Controversial</option>
                                                <option>Educational</option>
                                            </select>
                                        </div>
                                        <textarea className="col-span-2 w-full p-3 border rounded-lg bg-slate-50 text-sm resize-none" rows={3} placeholder="Bio / Company Mission" value={newLeader.description} onChange={e => setNewLeader({...newLeader, description: e.target.value})} />
                                        <input className="col-span-2 w-full p-3 border rounded-lg bg-slate-50 text-sm" placeholder="Expertise (comma separated, e.g. B2B SaaS, Finance)" value={newLeader.expertise?.join(', ')} onChange={e => setNewLeader({...newLeader, expertise: e.target.value.split(',').map(s => s.trim())})} />
                                    </div>
                                 </div>
                             </div>
                             
                             <div className="flex gap-4 mt-10">
                                 <button onClick={() => setIsAddingLeader(false)} className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold">Cancel</button>
                                 <button onClick={handleCreateLeader} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20">Create Account</button>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
         )}
      </div>
      
      {/* Subject Detail Drawer */}
      {selectedSubject && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
              <div className="bg-white w-[650px] h-full shadow-2xl p-0 overflow-y-auto flex flex-col animate-fade-in relative">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
                      <div>
                          <h2 className="text-2xl font-bold text-slate-900">{selectedSubject.name}</h2>
                          <div className="text-sm text-slate-500">{selectedSubject.role}, {selectedSubject.industry}</div>
                      </div>
                      <button onClick={() => setSelectedSubject(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
                  </div>
                  
                  <div className="p-6">
                      <div className="flex border-b border-slate-100 px-6 -mx-6 mb-6">
                          <button onClick={() => setActiveSubjectTab('PROFILE')} className={`pb-3 pt-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeSubjectTab === 'PROFILE' ? 'border-tv-teal text-tv-teal' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Profile</button>
                          <button onClick={() => setActiveSubjectTab('PRODUCTION')} className={`pb-3 pt-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeSubjectTab === 'PRODUCTION' ? 'border-tv-teal text-tv-teal' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Content</button>
                          <button onClick={() => setActiveSubjectTab('LLM')} className={`pb-3 pt-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeSubjectTab === 'LLM' ? 'border-tv-teal text-tv-teal' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>LLM</button>
                          <button onClick={() => setActiveSubjectTab('PAYMENTS')} className={`pb-3 pt-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeSubjectTab === 'PAYMENTS' ? 'border-tv-teal text-tv-teal' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Payments</button>
                      </div>

                      <div className="flex-1">
                          {activeSubjectTab === 'PROFILE' && (
                              <div className="space-y-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Core Identity</h4>
                                        {!isEditingIdentity && (
                                            <button onClick={() => { setIsEditingIdentity(true); setEditedSubject(selectedSubject); }} className="text-tv-teal text-xs font-bold hover:underline">Edit</button>
                                        )}
                                    </div>
                                    {isEditingIdentity ? (
                                        <div className="space-y-4 text-sm">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                                    <input className="w-full p-2 border rounded-lg bg-slate-50" value={editedSubject.name} onChange={e => setEditedSubject({...editedSubject, name: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                                    <input className="w-full p-2 border rounded-lg bg-slate-50" value={editedSubject.role} onChange={e => setEditedSubject({...editedSubject, role: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Industry</label>
                                                    <input className="w-full p-2 border rounded-lg bg-slate-50" value={editedSubject.industry} onChange={e => setEditedSubject({...editedSubject, industry: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                                    <input className="w-full p-2 border rounded-lg bg-slate-50" value={editedSubject.contact?.primary.email} onChange={e => setEditedSubject({
                                                        ...editedSubject, 
                                                        contact: { ...editedSubject.contact!, primary: { ...editedSubject.contact!.primary, email: e.target.value } } 
                                                    })} />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                                    <input className="w-full p-2 border rounded-lg bg-slate-50" value={editedSubject.contact?.primary.phone || ''} onChange={e => setEditedSubject({
                                                        ...editedSubject, 
                                                        contact: { ...editedSubject.contact!, primary: { ...editedSubject.contact!.primary, phone: e.target.value } } 
                                                    })} />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-4">
                                                <button onClick={() => setIsEditingIdentity(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                                <button onClick={handleSaveSubjectProfile} className="px-6 py-2 text-sm font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-700 shadow-md">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                                <span className="text-slate-400">Full Name</span>
                                                <span className="font-bold text-slate-900">{selectedSubject.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                                <span className="text-slate-400">Role</span>
                                                <span className="font-bold text-slate-900">{selectedSubject.role}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                                <span className="text-slate-400">Industry</span>
                                                <span className="font-bold text-slate-900">{selectedSubject.industry}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                                <span className="text-slate-400">Email</span>
                                                <span className="font-bold text-slate-900">{selectedSubject.contact.primary.email}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1">
                                                <span className="text-slate-400">Phone</span>
                                                <span className="font-bold text-slate-900">{selectedSubject.contact.primary.phone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400">Strategic Profile</h4>
                                        {!isEditingSubject && (
                                            <button onClick={() => { setIsEditingSubject(true); setEditedSubject(selectedSubject); }} className="text-tv-teal text-xs font-bold hover:underline">Edit</button>
                                        )}
                                    </div>
                                    
                                    {isEditingSubject ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tone Style</label>
                                                <select className="w-full p-2 border rounded-lg bg-slate-50 text-sm" value={editedSubject.toneStyle} onChange={e => setEditedSubject({...editedSubject, toneStyle: e.target.value})}>
                                                    <option>Professional</option>
                                                    <option>Casual</option>
                                                    <option>Authoritative</option>
                                                    <option>Empathetic</option>
                                                    <option>Controversial</option>
                                                    <option>Educational</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Website</label>
                                                <input className="w-full p-2 border rounded-lg bg-slate-50 text-sm" value={editedSubject.website} onChange={e => setEditedSubject({...editedSubject, website: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Bio / Description</label>
                                                <textarea className="w-full p-2 border rounded-lg bg-slate-50 text-sm resize-none" rows={4} value={editedSubject.description} onChange={e => setEditedSubject({...editedSubject, description: e.target.value})} />
                                            </div>
                                            <div className="flex gap-3 justify-end pt-2">
                                                <button onClick={() => setIsEditingSubject(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                                <button onClick={handleSaveSubjectProfile} className="px-6 py-2 text-sm font-bold bg-tv-teal text-white rounded-xl hover:bg-teal-600 shadow-md">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Tone Style</label>
                                                <div className="inline-block bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-900">{selectedSubject.toneStyle || 'Professional'}</div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Website</label>
                                                <a href={`https://${selectedSubject.website}`} target="_blank" rel="noreferrer" className="text-tv-teal text-sm font-bold hover:underline block truncate">{selectedSubject.website}</a>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Bio / Description</label>
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{selectedSubject.description || 'No description available.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Platforms</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSubject.platforms.map(p => (
                                                <span key={p} className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-md tracking-wider">{p}</span>
                                            ))}
                                            {selectedSubject.platforms.length === 0 && <span className="text-xs text-slate-400 italic">None selected</span>}
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Review Process</h4>
                                        <div className="text-sm font-black text-slate-800 mb-2">{selectedSubject.reviewer.mode === 'SELF' ? 'Self Review' : 'Team Review'}</div>
                                        {selectedSubject.reviewer.mode === 'TEAM' && (
                                            <div className="space-y-1">
                                                {selectedSubject.reviewer.teamMembers.map((m, i) => (
                                                    <div key={i} className="text-xs text-slate-500 font-medium">{m.name}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-4">Strategic Direction (Expertise)</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedSubject.expertise.map((t, i) => (
                                            <span key={i} className="text-xs font-bold bg-tv-teal/10 text-tv-teal border border-tv-teal/20 px-3 py-1.5 rounded-full">{t}</span>
                                        ))}
                                        {selectedSubject.expertise.length === 0 && <span className="text-xs text-slate-400 italic">No expertise topics listed</span>}
                                    </div>
                                </div>

                                 <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
                                    <h4 className="font-bold text-xs uppercase tracking-widest mb-4 opacity-50">Assets</h4>
                                    <div className="space-y-3">
                                        <a href="#" className="flex items-center justify-between group p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Project Folder</span>
                                            <Folder size={16} className="text-tv-teal group-hover:scale-110 transition-transform" />
                                        </a>
                                        <a href="#" className="flex items-center justify-between group p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <span className="text-sm font-bold">Dashboard Link</span>
                                            <ExternalLink size={16} className="text-tv-teal group-hover:scale-110 transition-transform" />
                                        </a>
                                    </div>
                                </div>
                              </div>
                          )}

                          {activeSubjectTab === 'PRODUCTION' && (
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2"><Calendar size={16} /> Upcoming Prompts</h4>
                                        <div className="space-y-2">
                                            {scheduledPrompts.filter(p => p.userId === selectedSubject.id).map(p => (
                                                <div key={p.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-500">{new Date(p.scheduledFor).toLocaleDateString()}</div>
                                                        <div className="text-sm font-medium text-slate-900 truncate max-w-[300px]">"{p.question}"</div>
                                                    </div>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">SCHEDULED</span>
                                                </div>
                                            ))}
                                            {scheduledPrompts.filter(p => p.userId === selectedSubject.id).length === 0 && (
                                                <p className="text-xs text-slate-400 italic">No prompts scheduled.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2"><FolderOpen size={16} /> Content Assets</h4>
                                        <div className="space-y-2">
                                            {subjectContent.map(c => (
                                                <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-tv-teal transition-colors flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${c.type === 'VIDEO' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                                            {c.type === 'VIDEO' ? <Video size={14} /> : <FileAudio size={14} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{c.title}</div>
                                                            <div className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()} • {c.status.replace(/_/g, ' ')}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                         {c.storagePath && (
                                                             <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded" title="Open Folder">
                                                                 <ExternalLink size={14} />
                                                             </button>
                                                         )}
                                                    </div>
                                                </div>
                                            ))}
                                            {subjectContent.length === 0 && <p className="text-xs text-slate-400 italic">No content assets found.</p>}
                                        </div>
                                    </div>
                                </div>
                          )}

                          {activeSubjectTab === 'LLM' && (
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 text-sm mb-1 flex items-center gap-2"><BrainCircuit size={16} /> Strategy Context Agent</h4>
                                        <p className="text-xs text-indigo-700 leading-relaxed">
                                            These instructions are injected into the AI generation pipeline for this specific leader. 
                                            Use this to define their unique voice, forbidden topics, or specific formatting rules.
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <textarea 
                                            className="w-full h-full min-h-[300px] p-4 border border-slate-300 rounded-xl font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                            placeholder="e.g. 'Always use a professional but approachable tone. Avoid jargon. Focus on sustainable growth metrics...'"
                                            value={llmInstructions}
                                            onChange={(e) => setLlmInstructions(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <button onClick={saveSubjectLLM} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95">
                                            <Save size={18} /> Update Instructions
                                        </button>
                                    </div>
                                </div>
                          )}
                          
                          {activeSubjectTab === 'PAYMENTS' && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><CreditCard size={14} /> Transaction Ledger</h4>
                                    {subjectPayments.length === 0 ? (
                                        <p className="text-xs text-slate-400 italic">No payments recorded for this subject.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                                                        <th className="pb-3">Date</th>
                                                        <th className="pb-3">Plan</th>
                                                        <th className="pb-3">Amount</th>
                                                        <th className="pb-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {subjectPayments.map(pay => (
                                                        <tr key={pay.id} className="hover:bg-white/50 transition-colors">
                                                            <td className="py-4 text-slate-600 font-medium">{new Date(pay.date).toLocaleDateString()}</td>
                                                            <td className="py-4 font-bold text-slate-900">{pay.planName}</td>
                                                            <td className="py-4 font-black text-slate-900">${pay.amount.toLocaleString()}</td>
                                                            <td className="py-4 text-right">
                                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${pay.status === 'PROCESSED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pay.status}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Support Ticket Modal */}
      {selectedTicket && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-3xl max-w-xl w-full overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">Support Request</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ticket ID: {selectedTicket.id}</p>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-200"><X size={20} /></button>
                  </div>
                  
                  <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">User Name</label>
                              <div className="font-bold text-slate-900">{selectedTicket.userName}</div>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                              <div className="font-bold text-slate-900">{selectedTicket.userEmail}</div>
                          </div>
                      </div>

                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                          <label className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 block">Issue Reported</label>
                          <p className="text-slate-800 font-medium leading-relaxed">{selectedTicket.issue}</p>
                      </div>

                      {selectedTicket.partialProfile && (
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">Onboarding Snapshot</label>
                             <div className="grid grid-cols-2 gap-4 text-xs">
                                 <div><span className="text-slate-400 font-bold">Role:</span> {selectedTicket.partialProfile.role || 'N/A'}</div>
                                 <div><span className="text-slate-400 font-bold">Industry:</span> {selectedTicket.partialProfile.industry || 'N/A'}</div>
                                 <div className="col-span-2"><span className="text-slate-400 font-bold">Website:</span> {selectedTicket.partialProfile.website || 'N/A'}</div>
                             </div>
                          </div>
                      )}

                      <div className="flex gap-4 pt-4">
                          <button onClick={() => setSelectedTicket(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200">Close</button>
                          <button 
                            onClick={handleResolveTicket} 
                            disabled={isProcessingTicket || selectedTicket.status === 'RESOLVED'} 
                            className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-green-900/20 hover:bg-green-500 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isProcessingTicket ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Resolve Ticket</>}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      {/* Prompt Scheduler Modal */}
      {promptSchedulingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-fade-in-up border border-slate-100">
              <h3 className="font-bold text-xl mb-4 text-slate-900">Schedule Delivery</h3>
              <p className="text-sm text-slate-500 mb-6">Select the next available slot for this thought leadership prompt.</p>
              
              <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <button 
                      onClick={() => handleSchedulePrompt(promptSchedulingId, undefined, true)}
                      className="w-full text-left p-4 rounded-xl border border-tv-teal bg-teal-50 hover:bg-teal-100 flex justify-between items-center transition-all group"
                  >
                      <span className="font-bold text-tv-teal">Deliver Now</span>
                      <Zap size={18} className="text-tv-teal animate-pulse" />
                  </button>
                  {availableDates.map(date => (
                      <button 
                          key={date.toISOString()} 
                          onClick={() => handleSchedulePrompt(promptSchedulingId, date.toISOString())}
                          className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-tv-teal hover:bg-slate-50 text-sm font-bold text-slate-700 transition-all flex justify-between items-center"
                      >
                          <span>{date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                          <Calendar size={14} className="text-slate-300" />
                      </button>
                  ))}
              </div>
              <button onClick={() => setPromptSchedulingId(null)} className="w-full py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl font-bold transition-colors">Dismiss</button>
           </div>
        </div>
      )}

      {/* Kanban Item Modal */}
      {kanbanModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900">
                              {kanbanMode === 'PROMPT' ? 'Review Schedule' : 'Job Details'}
                          </h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Production Stage: {selectedKanbanItem?.status || 'Active'}</p>
                      </div>
                      <button onClick={() => setKanbanModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-slate-200"><X size={20} /></button>
                  </div>
                  <div className="p-8 overflow-y-auto space-y-8 flex-1">
                      {kanbanMode === 'PROMPT' && selectedPromptItem && (
                          <>
                             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                 <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">Leader Account</label>
                                 <div className="font-bold text-indigo-900 text-lg">{crmUsers.find(u => u.id === selectedPromptItem.userId)?.name}</div>
                             </div>
                             <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Prompt Logic</label>
                                 <textarea className="w-full p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 min-h-[120px] font-medium leading-relaxed" value={editPromptText} onChange={e => setEditPromptText(e.target.value)}/>
                             </div>
                             <div>
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Planned Date</label>
                                 <div className="relative">
                                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="date" className="w-full pl-11 p-4 border border-slate-200 rounded-2xl text-sm bg-slate-50 font-bold" value={editPromptDate.split('T')[0]} onChange={e => setEditPromptDate(new Date(e.target.value).toISOString())} />
                                 </div>
                             </div>
                             <div className="flex gap-3 pt-4">
                                 <button onClick={() => setKanbanModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Close</button>
                                 <button onClick={handleUpdatePrompt} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl shadow-slate-900/20 active:scale-95 transition-transform">Apply Changes</button>
                             </div>
                          </>
                      )}
                      {kanbanMode === 'CONTENT' && selectedKanbanItem && (
                          <>
                             {selectedKanbanItem.status === ContentStatus.SUBMITTED_TO_EDITORS && (
                                 <>
                                    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-sm shadow-inner relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-tv-teal opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        <div className="font-bold text-tv-teal mb-2 uppercase text-[10px] tracking-widest">Asset Repository</div>
                                        <code className="bg-black/50 text-slate-300 px-3 py-2 rounded-xl border border-white/5 block truncate font-mono text-xs mb-3">{selectedKanbanItem.storagePath || '/path/to/assets'}</code>
                                        <button className="text-white bg-tv-teal/20 hover:bg-tv-teal/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                                            <Folder size={14} /> Access Raw Files
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Production Lead</label>
                                        <div className="relative">
                                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select className="w-full pl-11 p-4 border border-slate-200 rounded-2xl bg-white font-bold text-slate-700 outline-none focus:ring-2 focus:ring-tv-teal/20" value={assignEditorId} onChange={e => setAssignEditorId(e.target.value)}>
                                                <option value="">Select Editor...</option>
                                                {teamMembers.filter(t => t.role === 'Editor').map(tm => (
                                                    <option key={tm.id} value={tm.id}>{tm.name} (Load: {tm.currentLoad})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={handleAssignEditor} disabled={!assignEditorId} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 shadow-2xl transition-all flex items-center justify-center gap-3">
                                        Move to Editing <MoveRight size={20} />
                                    </button>
                                 </>
                             )}
                             {selectedKanbanItem.status === ContentStatus.EDITING_IN_PROGRESS && (
                                 <>
                                     <div className="flex justify-between items-center bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                        <div>
                                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Assigned Editor</div>
                                            <div className="font-black text-blue-900 text-lg">{teamMembers.find(t => t.id === selectedKanbanItem.assignedTo)?.name}</div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 ${selectedKanbanItem.editorStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700 border-green-200' : selectedKanbanItem.editorStatus === 'REJECTED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                            {selectedKanbanItem.editorStatus || 'Awaiting Acceptance'}
                                        </div>
                                    </div>
                                    {currentUser?.id === selectedKanbanItem.assignedTo && selectedKanbanItem.editorStatus === 'PENDING' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => handleEditorAccept(true)} className="py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-900/20 hover:bg-green-500 transition-colors">Accept Workflow</button>
                                            <button onClick={() => handleEditorAccept(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-colors">Reject</button>
                                        </div>
                                    )}
                                    <button onClick={handleMoveToReview} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 shadow-2xl transition-all flex items-center justify-center gap-3">
                                        Submit for Subject Review <CheckCircle size={20} />
                                    </button>
                                 </>
                             )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
