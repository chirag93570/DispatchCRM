export enum LeadStatus {
  NEW = 'NEW',
  CALLING = 'CALLING',
  RETRY = 'RETRY',
  INTERESTED = 'INTERESTED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  WRONG_NUMBER = 'WRONG_NUMBER',
  DISCONNECTED_NUMBER = 'DISCONNECTED_NUMBER', 
  DNC = 'DNC',
  BOOKED = 'BOOKED',
  ONBOARDED = 'ONBOARDED' 
}

export enum SalesStage {
  PROSPECTING = 'Prospecting',
  QUALIFICATION = 'Qualification',
  DISCOVERY = 'Discovery / Demo',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export type AppView = 'CRM_DASHBOARD' | 'CALL_OVERVIEW' | 'PIPELINE' | 'DIALER' | 'EMAIL_MARKETING' | 'RATE_CONFIRMATION' | 'HISTORY' | 'SETTINGS';

export interface Note {
  id: string;
  content: string;
  timestamp: string; 
}

export interface CallLog {
  id: string;
  leadId: string | null; // Null if manual dial
  companyName: string;
  phoneNumber: string;
  outcome: string; // Changed to string to allow custom dispositions
  note: string;
  timestamp: string;
  durationSeconds: number;
  recordingUrl?: string; // New: For playback
}

export interface Lead {
  id: string;
  serialNumber: number; 
  companyName: string;
  mcNumber: string;
  phoneNumber: string;
  email: string;
  status: LeadStatus;
  lastCallTime?: string; 
  nextFollowUp?: string; 
  notes: Note[];
  state?: string;
  truckCount?: number;
}

export interface Opportunity {
  id: string;
  title: string;
  companyName: string;
  value: number;
  stage: SalesStage;
  owner: string;
  nextAction: string;
  expectedCloseDate: string;
  probability: number;
}

export interface DashboardStats {
  totalCallsToday: number;
  interestedLeads: number;
  retryQueue: number;
  dncCount: number;
  totalLeads: number;
  leadsInQueue: number;
  onboardedCount: number;
  avgTalkTime: number;
}

export interface AppSettings {
  dispatcherName: string;
  companyName: string;
  theme: 'dark' | 'light';
}

export interface EmailCampaign {
  id: string;
  name: string;
  status: 'Draft' | 'Sent' | 'Scheduled';
  subject: string;
  sentCount: number;
  openRate: number;
}
