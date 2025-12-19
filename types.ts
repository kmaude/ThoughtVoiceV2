export enum PlanTier {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SocialPlatform {
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  INSTAGRAM = 'INSTAGRAM',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK'
}

export enum ScheduleFrequency {
  DAILY_MON_FRI = 'DAILY_MON_FRI',
  WEEKENDS = 'WEEKENDS',
  RANDOM_1X = 'RANDOM_1X',
  RANDOM_2X = 'RANDOM_2X',
  RANDOM_3X = 'RANDOM_3X'
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  selected: boolean;
  active: boolean; // Added for admin control
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  frequency: ScheduleFrequency;
  deliverables: string[];
  subscriberCount: number;
  revenue: number;
  activeDays?: number[]; // 0=Sun, 1=Mon...
  maxPlatforms: number; // Limit on number of social accounts
  active: boolean; // Added for admin control
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  usageCount: number;
  active: boolean;
  expiresAt?: string;
  trialPeriodDays?: number; // Free trial length
  duration?: 'ONCE' | 'REPEATING' | 'FOREVER';
  durationInMonths?: number; // If REPEATING
}

export interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
}

export interface ContactSettings {
  primary: ContactPerson;
  ccEmail?: string;
  preferredChannel: 'EMAIL' | 'SMS' | 'BOTH';
  optInPrompts: boolean;
}

export interface ReviewerConfig {
  mode: 'SELF' | 'TEAM';
  teamMembers: ContactPerson[];
  ccEmail?: string;
}

export enum CustomerStatus {
  LEAD = 'LEAD',
  ONBOARDING = 'ONBOARDING',
  ACTIVE = 'ACTIVE',
  CHURNED = 'CHURNED',
  PAUSED = 'PAUSED'
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  industry: string;
  website: string;
  description?: string;
  brandLogoUrl?: string; 
  rootFolder?: string; // Cloud Storage Root: /[Name]_[ID]
  linkedin: string;
  expertise: string[];
  tone: number;
  toneStyle?: string; // "Professional", "Casual", etc.
  llmInstructions?: string; // Specific instructions for AI generation (RAG)
  password?: string; // Account access password
  
  platforms: SocialPlatform[];
  schedule: ScheduleFrequency;
  addOns: AddOn[];
  timezone: string;
  
  plan: PlanTier;
  planId?: string; // Links to SubscriptionPlan
  isOnboarded: boolean;
  contact: ContactSettings;
  reviewer: ReviewerConfig;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE';
  
  defaultCaptureMode?: 'video' | 'audio';
  preferredVideoDeviceId?: string;
  preferredAudioDeviceId?: string;

  // CRM Fields
  customerStatus?: CustomerStatus;
  accountManagerId?: string; // Links to TeamMember
  defaultEditorId?: string; // Links to TeamMember (Preferred editor)
  internalNotes?: string;
  joinDate?: string;
  ltv?: number; // Lifetime Value
  lastPaymentDate?: string;
}

export interface Source {
  title: string;
  uri: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: 'Strategic' | 'Trending' | 'Competitor Gap';
  relevanceScore: number;
  sources?: Source[];
}

export enum PromptStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface DailyPrompt {
  id: string;
  userId: string;
  status: PromptStatus;
  scheduledFor: string; // ISO Date String
  
  // Content
  context: string;
  contextPoints?: string[]; // Bullet points for user context
  question: string;
  angleVideo: string;
  anglePost: string;
  
  // Agent Research Data
  reasoning: string;
  supportingData: string;
  keywords: string[];
  matrixCategory?: string; // e.g. "Column A: Hard Lesson"
  difficulty?: 'Starter' | 'Intermediate' | 'Advanced';
  sources?: Source[];

  // Storage
  responseFolderPath?: string; // /prompt_responses/MM-DD-YYYY
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED_TO_EDITORS = 'SUBMITTED_TO_EDITORS', 
  EDITING_IN_PROGRESS = 'EDITING_IN_PROGRESS',   
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',         
  APPROVED = 'APPROVED', 
  REJECTED = 'REJECTED',
  REJECTED_BY_CLIENT = 'REJECTED_BY_CLIENT',
  PUBLISHED = 'PUBLISHED'
}

export enum ContentType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT'
}

export interface GeneratedAssets {
  cleanScript: string;
  linkedInPost: string;
  twitterThread: string[];
  blogOutline: string;
  emailNewsletter: string;
  hooks: string[];
}

export interface Comment {
  id: string;
  timestamp: number; // seconds
  text: string;
  author: string;
  createdAt: string;
}

export interface ApprovalRecord {
  approvedBy: string;
  approvedAt: string;
  notes?: string;
}

export interface ContentItem {
  id: string;
  userId: string; // Link to the Leader
  title: string;
  createdAt: string;
  status: ContentStatus;
  type: ContentType;
  originalTranscript?: string;
  assets?: GeneratedAssets;
  topicId?: string;
  mediaUrl?: string; 
  editorNotes?: string; 
  
  requiredDeliverables?: string[]; 
  platforms?: SocialPlatform[];

  // Ops Fields
  brandLogoUrl?: string;
  promptContext?: string;
  promptId?: string;
  assignedTo?: string; // TeamMember ID
  editorStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED'; // Did the editor accept the job?
  reviewFolderPath?: string; // Path to "review" folder on cloud
  
  timelineType?: string; // WorkflowDefinition ID
  comments?: Comment[];
  storagePath?: string; // Cloud Storage Path
  
  approval?: ApprovalRecord;
  history?: ProcessNote[];
}

export interface ProcessNote {
  id: string;
  text: string;
  authorName: string;
  timestamp: string;
  stage: ContentStatus;
}

export type EmploymentType = 'W2' | '1099' | 'CONTRACTOR_OTHER';

export enum InvoiceStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PAID = 'PAID',
  REJECTED = 'REJECTED'
}

export interface Invoice {
  id: string;
  staffId: string;
  amount: number;
  date: string;
  fileUrl: string;
  status: InvoiceStatus;
  notes?: string;
}

export interface ClientPayment {
  id: string;
  userId: string;
  amount: number;
  date: string;
  status: 'PROCESSED' | 'FAILED' | 'REFUNDED';
  planName: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'Editor' | 'Strategist' | 'Manager' | 'Account Manager' | 'Admin';
  email: string;
  password?: string; // For simulation
  slackHandle: string;
  phone: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  currentLoad: number; // 0-5 tasks
  avatar: string;
  
  // HR & Accounting
  employmentType: EmploymentType;
  hourlyRate: number; // New field
  onboardingStatus: 'PENDING' | 'COMPLETE';
  w9Url?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  slaHours: number;
  type: 'STANDARD' | 'RUSH' | 'COMPLEX';
}

export interface NotificationLog {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS';
  content: string;
  sentAt: string;
}

export interface AnalyticsData {
  date: string;
  engagement: number;
  posts: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'PROMPT_SENT' | 'RECORDING_RECEIVED' | 'REVIEW_COMPLETED' | 'ERROR' | 'INFO';
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface CRMReport {
  totalClients: number;
  activeProjects: number;
  contentVelocity: number; // Items per week
  totalRevenue: number;
  contractorCost: number;
  w2CostEstimates: number;
  netProfit: number;
  bottlenecks: string[];
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  issue: string;
  status: 'OPEN' | 'RESOLVED';
  createdAt: string;
  partialProfile: UserProfile; // Snapshot of what they tried to submit
}
