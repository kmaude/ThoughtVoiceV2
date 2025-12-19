import { UserProfile, ContentItem, PlanTier, ContentStatus, SocialPlatform, ScheduleFrequency, TeamMember, WorkflowDefinition, DailyPrompt, NotificationLog, AddOn, ProcessNote, PromptStatus, CustomerStatus, ActivityLog, CRMReport, SubscriptionPlan, Coupon, Invoice, InvoiceStatus, EmploymentType, ClientPayment, SupportTicket } from '../types';
import { notificationService } from './notifications';
import { createClient } from '@supabase/supabase-js';

const DB_KEYS = {
  PROFILE: 'tv_db_profile',
  ALL_USERS: 'tv_db_crm_users', 
  CONTENT: 'tv_db_content',
  PROMPTS: 'tv_db_prompts', 
  NOTIFICATIONS: 'tv_db_notifications',
  TEAM: 'tv_db_team',
  ACTIVITY_LOGS: 'tv_db_activity_logs',
  PLANS: 'tv_db_plans',
  ADDONS: 'tv_db_addons',
  COUPONS: 'tv_db_coupons',
  INVOICES: 'tv_db_invoices',
  CLIENT_PAYMENTS: 'tv_db_client_payments',
  WORKFLOWS: 'tv_db_workflows',
  SUPABASE_CONFIG: 'tv_db_supabase_config',
  TICKETS: 'tv_db_support_tickets'
};

export const INITIAL_PROFILE: UserProfile = {
  id: `user-${Date.now()}`,
  name: '',
  role: '',
  industry: '',
  website: '',
  description: '',
  brandLogoUrl: '',
  linkedin: '',
  expertise: [],
  tone: 50,
  toneStyle: 'Professional',
  platforms: [SocialPlatform.LINKEDIN],
  schedule: ScheduleFrequency.DAILY_MON_FRI,
  addOns: [],
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  plan: PlanTier.PRO,
  isOnboarded: false,
  subscriptionStatus: 'INACTIVE',
  customerStatus: CustomerStatus.LEAD,
  password: '',
  contact: {
    primary: { name: '', email: '', phone: '' },
    preferredChannel: 'EMAIL',
    optInPrompts: true
  },
  reviewer: {
    mode: 'SELF',
    teamMembers: []
  },
  defaultCaptureMode: 'video',
  preferredVideoDeviceId: '',
  preferredAudioDeviceId: ''
};

export const MOCK_TEAM_DEFAULTS: TeamMember[] = [
  { id: 'tm-1', name: 'Alex Rivera', role: 'Editor', email: 'alex@thoughtvoice.ai', password: 'thoughtvoice', slackHandle: '@alex_edit', phone: '+15550101', status: 'AVAILABLE', currentLoad: 2, avatar: 'AR', employmentType: '1099', hourlyRate: 50, onboardingStatus: 'COMPLETE', w9Url: 'w9_mock.pdf' },
  { id: 'tm-2', name: 'Sarah Chen', role: 'Account Manager', email: 'sarah@thoughtvoice.ai', password: 'thoughtvoice', slackHandle: '@sarah_am', phone: '+15550102', status: 'BUSY', currentLoad: 4, avatar: 'SC', employmentType: 'W2', hourlyRate: 40, onboardingStatus: 'COMPLETE' }, 
  { id: 'tm-3', name: 'Mike Ross', role: 'Admin', email: 'mike@thoughtvoice.ai', password: 'thoughtvoice', slackHandle: '@mike_boss', phone: '+15550103', status: 'OFFLINE', currentLoad: 0, avatar: 'MR', employmentType: 'W2', hourlyRate: 80, onboardingStatus: 'COMPLETE' },
];

export const MOCK_ADDONS: AddOn[] = [
  { id: 'monthly_recap', name: 'Monthly Impact Recap', price: 50, description: 'Deep dive analytics & strategy adjustment', selected: false, active: true },
  { id: 'weekend_special', name: 'Weekend Deep-Dives', price: 100, description: 'Long-form essays generated from audio', selected: false, active: true },
  { id: 'extra_platform', name: 'Additional Platform', price: 150, description: 'Add 1 more social channel distribution', selected: false, active: true },
];

export const MOCK_CLIENT_PAYMENTS: ClientPayment[] = [
  { id: 'pay-1', userId: 'u-mock-1', amount: 999, date: '2023-10-01', status: 'PROCESSED', planName: 'Pro Authority' },
  { id: 'pay-2', userId: 'u-mock-2', amount: 499, date: '2023-10-02', status: 'PROCESSED', planName: 'Executive Starter' },
  { id: 'pay-3', userId: 'u-mock-1', amount: 999, date: '2023-09-01', status: 'PROCESSED', planName: 'Pro Authority' },
  { id: 'pay-4', userId: 'u-mock-3', amount: 999, date: '2023-10-05', status: 'FAILED', planName: 'Pro Authority' },
];

export const MOCK_TEAM = MOCK_TEAM_DEFAULTS;

export const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 'pl-1', name: 'Executive Starter', price: 499, description: 'Weekly thought leadership video.', frequency: ScheduleFrequency.RANDOM_1X, deliverables: ['1 Video/wk', 'Basic Edit'], subscriberCount: 12, revenue: 5988, activeDays: [3], maxPlatforms: 1, active: true },
  { id: 'pl-2', name: 'Pro Authority', price: 999, description: 'Daily prompts, full editing suite.', frequency: ScheduleFrequency.DAILY_MON_FRI, deliverables: ['Daily Prompts', 'Human Editing', 'Multi-Platform'], subscriberCount: 45, revenue: 44955, activeDays: [1,2,3,4,5], maxPlatforms: 3, active: true },
  { id: 'pl-3', name: 'Enterprise Scale', price: 2499, description: 'Unlimited access + dedicated strategist.', frequency: ScheduleFrequency.DAILY_MON_FRI, deliverables: ['Unlimited', 'Strategist', 'White-label'], subscriberCount: 5, revenue: 12495, activeDays: [1,2,3,4,5], maxPlatforms: 6, active: true }
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 'cp-1', code: 'LAUNCH20', discountType: 'PERCENT', discountValue: 20, usageCount: 5, active: true, duration: 'FOREVER' },
  { id: 'cp-2', code: 'FRIEND50', discountType: 'FIXED', discountValue: 50, usageCount: 2, active: true, duration: 'ONCE' },
  { id: 'cp-3', code: 'TRIAL30', discountType: 'PERCENT', discountValue: 100, usageCount: 10, active: true, trialPeriodDays: 30, duration: 'ONCE' }
];

export const WORKFLOWS_DEFAULT: WorkflowDefinition[] = [
  { id: 'wf-std', name: 'Standard Edit', slaHours: 48, type: 'STANDARD' },
  { id: 'wf-rush', name: 'Rush Turnaround', slaHours: 12, type: 'RUSH' },
  { id: 'wf-complex', name: 'Multi-Platform Repurpose', slaHours: 72, type: 'COMPLEX' },
];

const formatDateForFolder = (date: Date): string => {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
};

export const mockStorage = {
  initProfileFolders: (profile: UserProfile): string => {
    const sanitizedName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
    const rootPath = `/${sanitizedName}_${profile.id}`;
    return rootPath;
  },
  createPromptFolder: (rootPath: string, scheduledDateStr: string, existingCountForDay: number = 0): string => {
    const dateObj = new Date(scheduledDateStr);
    const folderDate = formatDateForFolder(dateObj);
    const suffix = existingCountForDay > 0 ? `_${String(existingCountForDay + 1).padStart(2, '0')}` : '';
    const folderName = `${folderDate}${suffix}`;
    const fullPath = `${rootPath}/prompt_responses/${folderName}`;
    return fullPath;
  },
  createReviewFolder: (rootPath: string): string => {
      return `${rootPath}/review_assets/${Date.now()}`;
  },
  createConciergeBatch: (rootPath: string): string => {
    const today = new Date();
    const folderDate = formatDateForFolder(today);
    const batchId = Math.floor(Math.random() * 100) + 1;
    const folderName = `${folderDate}_Batch${batchId}`;
    const fullPath = `${rootPath}/files_to_process/${folderName}`;
    return fullPath;
  },
  saveAsset: (folderPath: string, fileName: string) => {
    return `${folderPath}/${fileName}`;
  }
};

const isUSHoliday = (date: Date): boolean => {
  const month = date.getMonth(); 
  const day = date.getDate(); 
  if (month === 0 && day === 1) return true; // New Year
  if (month === 6 && day === 4) return true; // July 4
  if (month === 11 && day === 25) return true; // Christmas
  return false;
};

const generateSupabaseSchema = () => {
  return `
-- THOUGHTVOICE SUPABASE SCHEMA --
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT,
    industry TEXT,
    website TEXT,
    email TEXT,
    plan_id TEXT,
    customer_status TEXT,
    subscription_status TEXT,
    json_data JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
-- 2. Content Items Table
CREATE TABLE IF NOT EXISTS content_items (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id),
    title TEXT,
    status TEXT,
    type TEXT,
    transcript TEXT,
    assets JSONB, 
    prompt_id TEXT,
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
  `.trim();
};

const getSupabaseConfig = () => {
    const data = localStorage.getItem(DB_KEYS.SUPABASE_CONFIG);
    return data ? JSON.parse(data) : null;
};

const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem(DB_KEYS.SUPABASE_CONFIG, JSON.stringify({ url, key }));
};

const migrateToSupabase = async (url: string, key: string) => {
    try {
        const supabase = createClient(url, key);
        const users = await db.getAllUsers();
        for (const u of users) {
             const { error } = await supabase.from('profiles').upsert({
                 id: u.id,
                 name: u.name,
                 role: u.role,
                 industry: u.industry,
                 website: u.website,
                 email: u.contact.primary.email,
                 customer_status: u.customerStatus,
                 subscription_status: u.subscriptionStatus,
                 json_data: u
             });
             if (error) console.error("Error migrating user:", u.name, error);
        }
        return { success: true, count: users.length };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
};

export const db = {
  getUser: async (): Promise<UserProfile | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const data = localStorage.getItem(DB_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  clientLogin: async (email: string, password: string): Promise<UserProfile | null> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const users = await db.getAllUsers();
      const user = users.find(u => u.contact.primary.email.toLowerCase() === email.toLowerCase());
      
      if (user && user.password === password) {
          localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(user));
          return user;
      }
      return null;
  },

  updateUser: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
    const current = await db.getUser() || INITIAL_PROFILE;
    let updated = { ...current, ...updates };
    if (updated.name && updated.id && !updated.rootFolder) {
      updated.rootFolder = mockStorage.initProfileFolders(updated);
    }
    if (updates.brandLogoUrl && updates.brandLogoUrl !== current.brandLogoUrl && updated.rootFolder) {
       mockStorage.saveAsset(`${updated.rootFolder}/source_assets`, 'brand_logo.png');
    }
    if (updates.isOnboarded && !current.isOnboarded) {
        updated.joinDate = new Date().toISOString();
        updated.customerStatus = CustomerStatus.ACTIVE;
        db.logActivity(updated.id, 'INFO', 'User completed onboarding');
    }
    localStorage.setItem(DB_KEYS.PROFILE, JSON.stringify(updated));
    if (updated.id) {
       await db.crmUpdateUser(updated.id, updated);
    }
    return updated;
  },

  getAllUsers: async (): Promise<UserProfile[]> => {
    const realUser = await db.getUser();
    const crmData = localStorage.getItem(DB_KEYS.ALL_USERS);
    let users: UserProfile[] = crmData ? JSON.parse(crmData) : [];

    // Initialize mock users if empty - Pre-onboarded for easy testing
    if (users.length === 0) {
       users = [
         { ...INITIAL_PROFILE, id: 'u-mock-1', name: 'John Doe', role: 'CEO', industry: 'FinTech', plan: PlanTier.ENTERPRISE, customerStatus: CustomerStatus.ACTIVE, isOnboarded: true, subscriptionStatus: 'ACTIVE', accountManagerId: 'tm-2', joinDate: '2023-01-15', ltv: 12000, rootFolder: '/JohnDoe_u-mock-1', contact: { ...INITIAL_PROFILE.contact, primary: { name: 'John Doe', email: 'john@example.com' } }, toneStyle: 'Authoritative', password: 'password123', platforms: [SocialPlatform.LINKEDIN, SocialPlatform.TWITTER], expertise: ['Blockchain Strategy', 'Global Finance', 'B2B SaaS'] },
         { ...INITIAL_PROFILE, id: 'u-mock-2', name: 'Alice Smith', role: 'Founder', industry: 'HealthTech', plan: PlanTier.PRO, customerStatus: CustomerStatus.ACTIVE, isOnboarded: true, subscriptionStatus: 'ACTIVE', accountManagerId: 'tm-1', joinDate: '2023-10-05', ltv: 999, rootFolder: '/AliceSmith_u-mock-2', contact: { ...INITIAL_PROFILE.contact, primary: { name: 'Alice Smith', email: 'alice@example.com' } }, toneStyle: 'Empathetic', password: 'password123', platforms: [SocialPlatform.LINKEDIN], expertise: ['Telemedicine', 'AI in Healthcare'] }
       ];
       localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
    }

    if (realUser && realUser.isOnboarded) {
        const idx = users.findIndex(u => u.id === realUser.id);
        if (idx === -1) {
            users.unshift(realUser);
        } else {
            users[idx] = realUser;
        }
    }
    return users;
  },

  getAddOns: async (): Promise<AddOn[]> => {
      const data = localStorage.getItem(DB_KEYS.ADDONS);
      if (data) return JSON.parse(data);
      localStorage.setItem(DB_KEYS.ADDONS, JSON.stringify(MOCK_ADDONS));
      return MOCK_ADDONS;
  },

  createAddOn: async (addon: AddOn): Promise<void> => {
      const addons = await db.getAddOns();
      addons.push(addon);
      localStorage.setItem(DB_KEYS.ADDONS, JSON.stringify(addons));
  },

  updateAddOn: async (id: string, updates: Partial<AddOn>): Promise<void> => {
      const addons = await db.getAddOns();
      const idx = addons.findIndex(a => a.id === id);
      if (idx !== -1) {
          addons[idx] = { ...addons[idx], ...updates };
          localStorage.setItem(DB_KEYS.ADDONS, JSON.stringify(addons));
      }
  },

  crmCreateUser: async (newUser: UserProfile): Promise<void> => {
      const rootFolder = mockStorage.initProfileFolders(newUser);
      const userWithFolders = { ...newUser, rootFolder };
      if (userWithFolders.brandLogoUrl) {
         mockStorage.saveAsset(`${rootFolder}/source_assets`, 'logo.png');
      }
      const users = await db.getAllUsers();
      users.push(userWithFolders);
      localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
      db.logActivity(userWithFolders.id, 'INFO', 'Subject added via CRM');
  },

  crmUpdateUser: async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
      const users = await db.getAllUsers();
      const idx = users.findIndex(u => u.id === userId);
      if (idx !== -1) {
          users[idx] = { ...users[idx], ...updates };
          localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
      }
  },

  resetUserPassword: async (userId: string): Promise<string> => {
      const users = await db.getAllUsers();
      const idx = users.findIndex(u => u.id === userId);
      const newPass = Math.random().toString(36).slice(-8);
      if (idx !== -1) {
          users[idx].password = newPass;
          localStorage.setItem(DB_KEYS.ALL_USERS, JSON.stringify(users));
          const currentUser = await db.getUser();
          if (currentUser?.id === userId) {
              db.updateUser({ password: newPass });
          }
      }
      return newPass;
  },

  getTeam: async (): Promise<TeamMember[]> => {
    const data = localStorage.getItem(DB_KEYS.TEAM);
    if (data) return JSON.parse(data);
    localStorage.setItem(DB_KEYS.TEAM, JSON.stringify(MOCK_TEAM_DEFAULTS));
    return MOCK_TEAM_DEFAULTS;
  },

  addTeamMember: async (member: TeamMember): Promise<void> => {
    const team = await db.getTeam();
    const tempPass = 'thoughtvoice123';
    const newMember = { ...member, password: tempPass, onboardingStatus: 'PENDING' as const };
    team.push(newMember);
    localStorage.setItem(DB_KEYS.TEAM, JSON.stringify(team));
    await notificationService.notifyStaffOnboarding(member.email, tempPass);
  },

  staffLogin: async (email: string, pass: string): Promise<TeamMember | null> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const team = await db.getTeam();
      const user = team.find(t => t.email.toLowerCase() === email.toLowerCase() && t.password === pass);
      return user || null;
  },
  
  updateStaffProfile: async (id: string, updates: Partial<TeamMember>) => {
      const team = await db.getTeam();
      const idx = team.findIndex(t => t.id === id);
      if (idx !== -1) {
          team[idx] = { ...team[idx], ...updates };
          localStorage.setItem(DB_KEYS.TEAM, JSON.stringify(team));
      }
  },

  getInvoices: async (): Promise<Invoice[]> => {
      const data = localStorage.getItem(DB_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
  },
  
  getClientPayments: async (): Promise<ClientPayment[]> => {
      const data = localStorage.getItem(DB_KEYS.CLIENT_PAYMENTS);
      if (data) return JSON.parse(data);
      localStorage.setItem(DB_KEYS.CLIENT_PAYMENTS, JSON.stringify(MOCK_CLIENT_PAYMENTS));
      return MOCK_CLIENT_PAYMENTS;
  },

  submitInvoice: async (staffId: string, amount: number, notes: string, fileUrl?: string): Promise<void> => {
      const invoices = await db.getInvoices();
      const team = await db.getTeam();
      const staff = team.find(t => t.id === staffId);
      const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          staffId,
          amount,
          date: new Date().toISOString(),
          status: InvoiceStatus.SUBMITTED,
          fileUrl: fileUrl || 'mock_invoice.pdf',
          notes
      };
      invoices.unshift(newInvoice);
      localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(invoices));
      if (staff) {
          await notificationService.notifyAdminInvoice(staff.name, amount);
      }
  },

  updateInvoiceStatus: async (id: string, status: InvoiceStatus): Promise<void> => {
      const invoices = await db.getInvoices();
      const idx = invoices.findIndex(i => i.id === id);
      if (idx !== -1) {
          invoices[idx].status = status;
          localStorage.setItem(DB_KEYS.INVOICES, JSON.stringify(invoices));
      }
  },

  runBillingCycle: async (): Promise<{processed: number, failed: number}> => {
      const users = await db.getAllUsers();
      const plans = await db.getPlans();
      const payments = await db.getClientPayments();
      
      let processed = 0;
      let failed = 0;

      for (const user of users) {
          if (user.subscriptionStatus === 'ACTIVE') {
              const plan = plans.find(p => p.name === user.plan) || plans[0];
              const isFailure = Math.random() < 0.15; 
              
              const newPayment: ClientPayment = {
                  id: `pay-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                  userId: user.id,
                  amount: plan.price + user.addOns.filter(a => a.selected).reduce((acc, a) => acc + a.price, 0),
                  date: new Date().toISOString(),
                  status: isFailure ? 'FAILED' : 'PROCESSED',
                  planName: user.plan
              };
              
              payments.unshift(newPayment);
              
              if (isFailure) failed++;
              else processed++;
          }
      }
      
      localStorage.setItem(DB_KEYS.CLIENT_PAYMENTS, JSON.stringify(payments));
      return { processed, failed };
  },

  getBillingIssues: async (): Promise<ClientPayment[]> => {
      const payments = await db.getClientPayments();
      return payments.filter(p => p.status === 'FAILED');
  },

  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const data = localStorage.getItem(DB_KEYS.PLANS);
    if (data) return JSON.parse(data);
    localStorage.setItem(DB_KEYS.PLANS, JSON.stringify(MOCK_PLANS));
    return MOCK_PLANS;
  },

  addPlan: async (plan: SubscriptionPlan) => {
    const plans = await db.getPlans();
    plans.push(plan);
    localStorage.setItem(DB_KEYS.PLANS, JSON.stringify(plans));
  },

  updatePlan: async (id: string, updates: Partial<SubscriptionPlan>) => {
      const plans = await db.getPlans();
      const idx = plans.findIndex(p => p.id === id);
      if (idx !== -1) {
          plans[idx] = { ...plans[idx], ...updates };
          localStorage.setItem(DB_KEYS.PLANS, JSON.stringify(plans));
      }
  },

  getWorkflows: async (): Promise<WorkflowDefinition[]> => {
    const data = localStorage.getItem(DB_KEYS.WORKFLOWS);
    if (data) return JSON.parse(data);
    localStorage.setItem(DB_KEYS.WORKFLOWS, JSON.stringify(WORKFLOWS_DEFAULT));
    return WORKFLOWS_DEFAULT;
  },

  addWorkflow: async (workflow: WorkflowDefinition) => {
    const wfs = await db.getWorkflows();
    wfs.push(workflow);
    localStorage.setItem(DB_KEYS.WORKFLOWS, JSON.stringify(wfs));
  },

  getCoupons: async (): Promise<Coupon[]> => {
    const data = localStorage.getItem(DB_KEYS.COUPONS);
    if (data) return JSON.parse(data);
    localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(MOCK_COUPONS));
    return MOCK_COUPONS;
  },

  addCoupon: async (coupon: Coupon) => {
    const coupons = await db.getCoupons();
    coupons.push(coupon);
    localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(coupons));
  },

  updateCoupon: async (id: string, updates: Partial<Coupon>) => {
      const coupons = await db.getCoupons();
      const idx = coupons.findIndex(c => c.id === id);
      if (idx !== -1) {
          coupons[idx] = { ...coupons[idx], ...updates };
          localStorage.setItem(DB_KEYS.COUPONS, JSON.stringify(coupons));
      }
  },

  logActivity: (userId: string, type: ActivityLog['type'], description: string, metadata?: any) => {
      const data = localStorage.getItem(DB_KEYS.ACTIVITY_LOGS);
      const logs: ActivityLog[] = data ? JSON.parse(data) : [];
      logs.push({
          id: `log-${Date.now()}`,
          userId,
          type,
          description,
          timestamp: new Date().toISOString(),
          metadata
      });
      localStorage.setItem(DB_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
  },

  getActivityLog: (userId: string): ActivityLog[] => {
      const data = localStorage.getItem(DB_KEYS.ACTIVITY_LOGS);
      const logs: ActivityLog[] = data ? JSON.parse(data) : [];
      return logs.filter(l => l.userId === userId).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  savePrompt: (prompt: DailyPrompt) => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    const idx = prompts.findIndex(p => p.id === prompt.id);
    if (idx >= 0) {
      prompts[idx] = prompt;
    } else {
      prompts.push(prompt);
    }
    localStorage.setItem(DB_KEYS.PROMPTS, JSON.stringify(prompts));
  },

  getPrompt: (id: string): DailyPrompt | undefined => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    return prompts.find(p => p.id === id);
  },

  getPendingPrompts: (): DailyPrompt[] => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    return prompts.filter(p => p.status === PromptStatus.PENDING_REVIEW);
  },

  getScheduledPrompts: (): DailyPrompt[] => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    return prompts.filter(p => p.status === PromptStatus.SCHEDULED);
  },

  getActivePromptForUser: async (userId: string): Promise<DailyPrompt | null> => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    const today = new Date().toISOString().split('T')[0];
    return prompts.find(p => 
      p.userId === userId && 
      (p.status === PromptStatus.SENT || p.status === PromptStatus.SCHEDULED) &&
      p.scheduledFor.startsWith(today)
    ) || null;
  },

  schedulePrompt: async (promptId: string, specificDate?: string, immediate = false): Promise<void> => {
    const data = localStorage.getItem(DB_KEYS.PROMPTS);
    const prompts: DailyPrompt[] = data ? JSON.parse(data) : [];
    const idx = prompts.findIndex(p => p.id === promptId);
    
    if (idx !== -1) {
      const prompt = prompts[idx];
      const users = await db.getAllUsers();
      const user = users.find(u => u.id === prompt.userId);
      
      let targetDate: string;
      if (immediate) {
          targetDate = new Date().toISOString();
      } else if (specificDate) {
        targetDate = new Date(specificDate).toISOString();
      } else {
        const nextDate = db.calculateNextSlot(prompts, user?.schedule || ScheduleFrequency.DAILY_MON_FRI);
        targetDate = nextDate.toISOString();
      }
      
      prompt.status = immediate ? PromptStatus.SENT : PromptStatus.SCHEDULED;
      prompt.scheduledFor = targetDate;

      if (user && user.rootFolder) {
         const existingForDay = prompts.filter(p => p.userId === user.id && p.scheduledFor.startsWith(targetDate.split('T')[0])).length;
         const promptFolder = mockStorage.createPromptFolder(user.rootFolder, targetDate, existingForDay);
         prompt.responseFolderPath = promptFolder;
      }
      
      db.logActivity(prompt.userId, 'PROMPT_SENT', `Prompt Scheduled: ${prompt.question}`, { date: targetDate });

      if (immediate || (new Date(prompt.scheduledFor).getTime() - Date.now()) < 86400000 * 2) {
         prompt.status = PromptStatus.SENT;
         if (user) {
           const link = `https://thoughtvoice.app/#/capture?promptId=${prompt.id}`;
           const msg = `New Prompt: ${prompt.question}. Record here: ${link}`;
           if (user.contact.preferredChannel === 'SMS' || user.contact.preferredChannel === 'BOTH') {
             await notificationService.sendTestSMS(user.contact.primary.phone || '');
             db.logNotification(user.id, 'SMS', msg);
           } else {
             db.logNotification(user.id, 'EMAIL', msg);
           }
         }
      }

      prompts[idx] = prompt;
      localStorage.setItem(DB_KEYS.PROMPTS, JSON.stringify(prompts));
    }
  },

  calculateNextSlot: (existingPrompts: DailyPrompt[], frequency: ScheduleFrequency): Date => {
    const bookedDates = existingPrompts
       .filter(p => p.status === PromptStatus.SCHEDULED || p.status === PromptStatus.SENT)
       .map(p => new Date(p.scheduledFor).toDateString());

    let candidate = new Date();
    candidate.setDate(candidate.getDate() + 1); 
    
    let loops = 0;
    while (loops < 30) {
      const day = candidate.getDay(); 
      let isAllowedDay = false;

      if (frequency === ScheduleFrequency.DAILY_MON_FRI) {
        if (day !== 0 && day !== 6) isAllowedDay = true;
      } else if (frequency === ScheduleFrequency.WEEKENDS) {
        if (day === 0 || day === 6) isAllowedDay = true;
      } else if (frequency === ScheduleFrequency.RANDOM_3X) {
        if (day === 1 || day === 3 || day === 5) isAllowedDay = true;
      } else {
        isAllowedDay = true; 
      }

      if (isAllowedDay && !isUSHoliday(candidate) && !bookedDates.includes(candidate.toDateString())) {
        return candidate;
      }

      candidate.setDate(candidate.getDate() + 1);
      loops++;
    }
    return new Date(); 
  },

  getContent: async (): Promise<ContentItem[]> => {
    const data = localStorage.getItem(DB_KEYS.CONTENT);
    return data ? JSON.parse(data) : [];
  },
  
  getContentForPeriod: async (userId: string, date: Date): Promise<ContentItem[]> => {
      const items = await db.getContent();
      const month = date.getMonth();
      const year = date.getFullYear();
      return items.filter(item => {
          const itemDate = new Date(item.createdAt);
          return item.userId === userId && itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });
  },

  createContent: async (item: ContentItem): Promise<void> => {
    const items = await db.getContent();
    const user = await db.getAllUsers().then(users => users.find(u => u.id === item.userId));

    const requiredDeliverables = new Set<string>();
    const platforms = user?.platforms || [];

    if (platforms.includes(SocialPlatform.TIKTOK) || platforms.includes(SocialPlatform.INSTAGRAM)) requiredDeliverables.add('9:16 (Vertical)');
    if (platforms.includes(SocialPlatform.LINKEDIN) || platforms.includes(SocialPlatform.FACEBOOK)) requiredDeliverables.add('4:5 (Portrait)');
    if (requiredDeliverables.size === 0) requiredDeliverables.add('16:9 (Landscape)');

    let storagePath = '';
    if (user?.rootFolder) {
        if (item.promptId) {
             const prompt = db.getPrompt(item.promptId);
             if (prompt && prompt.responseFolderPath) {
                 storagePath = prompt.responseFolderPath;
             }
        }
        if (!storagePath) {
             storagePath = `${user.rootFolder}/prompt_responses/Unassigned_${Date.now()}`;
        }
    }

    const enrichedItem: ContentItem = {
      ...item,
      platforms: platforms,
      requiredDeliverables: Array.from(requiredDeliverables),
      brandLogoUrl: user?.brandLogoUrl,
      timelineType: 'wf-std',
      storagePath: storagePath
    };

    items.unshift(enrichedItem);
    localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
    
    if (user) db.logActivity(user.id, 'RECORDING_RECEIVED', `Received: ${item.title}`);
    
    if (item.promptId) {
      const allPromptsData = localStorage.getItem(DB_KEYS.PROMPTS);
      const allPrompts: DailyPrompt[] = allPromptsData ? JSON.parse(allPromptsData) : [];
      
      const pIdx = allPrompts.findIndex(p => p.id === item.promptId);
      if (pIdx !== -1) {
        allPrompts[pIdx].status = PromptStatus.COMPLETED;
        localStorage.setItem(DB_KEYS.PROMPTS, JSON.stringify(allPrompts));
      }
    }
  },

  uploadConciergeFiles: async (userId: string, fileNames: string[]) => {
      const user = await db.getAllUsers().then(u => u.find(user => user.id === userId));
      if (!user || !user.rootFolder) return;

      const batchFolder = mockStorage.createConciergeBatch(user.rootFolder);
      fileNames.forEach(f => mockStorage.saveAsset(batchFolder, f));
      
      if (user.accountManagerId) {
          const am = MOCK_TEAM.find(t => t.id === user.accountManagerId);
          if (am) {
              await notificationService.notifyAccountManager(am.id, `New Concierge Files for ${user.name} in ${batchFolder}`);
          }
      }
      db.logActivity(user.id, 'INFO', `Concierge Upload: ${fileNames.length} files to ${batchFolder}`);
  },

  updateContentStatus: async (id: string, status: ContentStatus, assets?: any): Promise<void> => {
    const items = await db.getContent();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].status = status;
      if (assets) items[idx].assets = assets;
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
    }
  },
  
  approveContent: async (id: string, approverName: string): Promise<void> => {
    const items = await db.getContent();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].status = ContentStatus.APPROVED;
      items[idx].approval = {
        approvedBy: approverName,
        approvedAt: new Date().toISOString()
      };
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
    }
  },

  updateContentItem: (id: string, updates: Partial<ContentItem>) => {
    const data = localStorage.getItem(DB_KEYS.CONTENT);
    const items: ContentItem[] = data ? JSON.parse(data) : [];
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
    }
  },
  
  assignEditor: async (contentId: string, editorId: string) => {
      const items = await db.getContent();
      const idx = items.findIndex(i => i.id === contentId);
      if (idx !== -1) {
          const item = items[idx];
          const editor = (await db.getTeam()).find(t => t.id === editorId);
          const user = (await db.getAllUsers()).find(u => u.id === item.userId);
          
          item.status = ContentStatus.EDITING_IN_PROGRESS;
          item.assignedTo = editorId;
          item.editorStatus = 'PENDING';
          
          if (user?.rootFolder) {
              item.reviewFolderPath = mockStorage.createReviewFolder(user.rootFolder);
          }

          items[idx] = item;
          localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
          
          if (editor) {
              await notificationService.notifyAssignment(item, editor);
          }
      }
  },
  
  editorResponse: async (contentId: string, accepted: boolean) => {
      const items = await db.getContent();
      const idx = items.findIndex(i => i.id === contentId);
      if (idx !== -1) {
          items[idx].editorStatus = accepted ? 'ACCEPTED' : 'REJECTED';
          localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
      }
  },
  
  sendToReview: async (contentId: string) => {
      const items = await db.getContent();
      const idx = items.findIndex(i => i.id === contentId);
      if (idx !== -1) {
          const item = items[idx];
          item.status = ContentStatus.READY_FOR_REVIEW;
          items[idx] = item;
          localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
          const user = (await db.getAllUsers()).find(u => u.id === item.userId);
          if (user) {
              await notificationService.notifyReviewReady(user, item);
          }
      }
  },

  addProcessNote: async (contentId: string, text: string, authorName: string) => {
    const data = localStorage.getItem(DB_KEYS.CONTENT);
    const items: ContentItem[] = data ? JSON.parse(data) : [];
    const index = items.findIndex(i => i.id === contentId);
    
    if (index !== -1) {
      const item = items[index];
      const newNote: ProcessNote = {
        id: `pn-${Date.now()}`,
        text,
        authorName,
        timestamp: new Date().toISOString(),
        stage: item.status
      };
      
      const updatedHistory = [...(item.history || []), newNote];
      items[index] = { ...item, history: updatedHistory };
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
      await notificationService.notifyMention(text, item, authorName);
    }
  },

  getEmployeeQueue: async (): Promise<ContentItem[]> => {
    const items = await db.getContent();
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  updateJobStatus: async (id: string, status: ContentStatus, editorNotes?: string): Promise<void> => {
    const items = await db.getContent();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx].status = status;
      if (editorNotes !== undefined) items[idx].editorNotes = editorNotes;
      localStorage.setItem(DB_KEYS.CONTENT, JSON.stringify(items));
    }
  },
  
  getHistoricalContext: async (): Promise<string> => {
    const items = await db.getContent();
    return items.slice(0, 5).map(i => i.originalTranscript).filter(Boolean).join('\n---\n');
  },

  logNotification: async (userId: string, type: 'EMAIL' | 'SMS', content: string) => {
    const data = localStorage.getItem(DB_KEYS.NOTIFICATIONS);
    const logs: NotificationLog[] = data ? JSON.parse(data) : [];
    logs.push({ id: `notif-${Date.now()}`, userId, type, content, sentAt: new Date().toISOString() });
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(logs));
  },
  
  getDeliverySchedule: (frequency: ScheduleFrequency): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDay();
      if (isUSHoliday(d)) continue;
      if (frequency === ScheduleFrequency.DAILY_MON_FRI && (day !== 0 && day !== 6)) dates.push(d);
      else if (frequency === ScheduleFrequency.WEEKENDS) (day === 0 || day === 6) && dates.push(d);
      else if (frequency === ScheduleFrequency.RANDOM_1X && day === 3) dates.push(d);
      else if (frequency === ScheduleFrequency.RANDOM_2X && (day === 2 || day === 4)) dates.push(d);
      else if (frequency === ScheduleFrequency.RANDOM_3X && (day === 1 || day === 3 || day === 5)) dates.push(d);
    }
    return dates; 
  },

  getPromptHistory: async (userId: string): Promise<ContentItem[]> => {
    const items = await db.getContent();
    return items.filter(i => i.userId === userId); 
  },

  generateCRMReport: async (): Promise<CRMReport> => {
      const users = await db.getAllUsers();
      const content = await db.getContent();
      const team = await db.getTeam();
      const invoices = await db.getInvoices();
      
      const totalRevenue = users.reduce((acc, u) => acc + (u.ltv || 0), 0);
      const contractorCost = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((acc, i) => acc + i.amount, 0);
      
      const w2Cost = team.filter(t => t.employmentType === 'W2').reduce((acc, t) => {
         const hours = (t.currentLoad || 1) * 5 * 4; 
         return acc + (hours * (t.hourlyRate || 40) * 1.3);
      }, 0);

      const bottlenecks: string[] = [];
      if (content.filter(c => c.status === ContentStatus.EDITING_IN_PROGRESS).length > 5) bottlenecks.push("Editing Queue High");
      if (team.filter(t => t.status === 'BUSY').length > team.length * 0.7) bottlenecks.push("Staff Capacity Risk");

      return {
          totalClients: users.length,
          activeProjects: content.filter(c => c.status !== ContentStatus.PUBLISHED).length,
          contentVelocity: content.filter(c => (new Date().getTime() - new Date(c.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000).length,
          totalRevenue,
          contractorCost,
          w2CostEstimates: w2Cost,
          netProfit: totalRevenue - (contractorCost + w2Cost),
          bottlenecks
      };
  },

  createSupportTicket: async (partialProfile: UserProfile, issue: string): Promise<void> => {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    const tickets: SupportTicket[] = data ? JSON.parse(data) : [];
    
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userEmail: partialProfile.contact.primary.email,
      userName: partialProfile.name,
      issue,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      partialProfile
    };
    
    tickets.push(newTicket);
    localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
  },

  getSupportTickets: async (): Promise<SupportTicket[]> => {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  },

  resolveTicket: async (ticketId: string) => {
    const data = localStorage.getItem(DB_KEYS.TICKETS);
    const tickets: SupportTicket[] = data ? JSON.parse(data) : [];
    const idx = tickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      tickets[idx].status = 'RESOLVED';
      localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
    }
  },
  
  generateSchema: generateSupabaseSchema,
  saveSupabaseConfig: saveSupabaseConfig,
  getSupabaseConfig: getSupabaseConfig,
  migrateToSupabase: migrateToSupabase,
  mockStorage: mockStorage,
  isUSHoliday: isUSHoliday
};

export const storageService = {
  getProfile: () => {
    const data = localStorage.getItem(DB_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },
  getContent: () => {
    const data = localStorage.getItem(DB_KEYS.CONTENT);
    return data ? JSON.parse(data) : [];
  },
  updateContentItem: db.updateContentItem
};
