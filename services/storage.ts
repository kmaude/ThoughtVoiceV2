import { UserProfile, ContentItem, PlanTier, SocialPlatform, ScheduleFrequency } from '../types';

const KEYS = {
  PROFILE: 'tv_profile',
  CONTENT: 'tv_content',
  TOPICS: 'tv_topics'
};

export const storageService = {
  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  saveContent: (items: ContentItem[]) => {
    localStorage.setItem(KEYS.CONTENT, JSON.stringify(items));
  },

  getContent: (): ContentItem[] => {
    const data = localStorage.getItem(KEYS.CONTENT);
    return data ? JSON.parse(data) : [];
  },

  addContentItem: (item: ContentItem) => {
    const items = storageService.getContent();
    items.unshift(item); // Add to top
    storageService.saveContent(items);
  },

  updateContentItem: (id: string, updates: Partial<ContentItem>) => {
    const items = storageService.getContent();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      storageService.saveContent(items);
    }
  }
};

export const INITIAL_PROFILE: UserProfile = {
  id: '',
  name: '',
  role: '',
  industry: '',
  website: '',
  brandLogoUrl: '',
  linkedin: '',
  expertise: [],
  tone: 50,
  platforms: [SocialPlatform.LINKEDIN],
  schedule: ScheduleFrequency.DAILY_MON_FRI,
  timezone: 'UTC',
  plan: PlanTier.PRO,
  isOnboarded: false,
  subscriptionStatus: 'INACTIVE',
  addOns: [],
  contact: {
    primary: {
      name: '',
      email: '',
      phone: ''
    },
    preferredChannel: 'EMAIL',
    optInPrompts: false
  },
  reviewer: {
    mode: 'SELF',
    teamMembers: []
  }
};