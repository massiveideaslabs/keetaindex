export enum Category {
  ALL = 'All',
  DEFI = 'DeFi',
  NFT = 'NFT',
  TOKENS = 'Tokens',
  INFRASTRUCTURE = 'Infrastructure',
  TOOLS = 'Tools',
  SOCIAL = 'Social',
  WALLET = 'Wallet',
  EVENTS = 'Events'
}

export interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  category: Category;
  tags: string[];
  addedAt: number;
  clicks?: number;
  featured?: boolean;
  approved?: boolean;
}

export interface Report {
  id: string;
  appId: string;
  appName: string;
  reasons: string[];
  timestamp: number;
}

export interface SubmissionData {
  name: string;
  description: string;
  url: string;
  category: Category;
}