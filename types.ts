// --- ORIGINAL CRM TYPES (DO NOT REMOVE) ---
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
  leadId: string | null;
  companyName: string;
  phoneNumber: string;
  outcome: string;
  note: string;
  timestamp: string;
  durationSeconds: number;
  recordingUrl?: string;
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

// --- NEW TMS TYPES (ADDED SAFELY FOR DISPATCH) ---

export type AssetType = 'Truck' | 'Trailer';
export type AssetStatus = 'Active' | 'Maintenance' | 'Inactive';
export type TripStatus = 'Planned' | 'Active' | 'Completed';
export type LoadStatus = 'Pending' | 'Dispatched' | 'In-Transit' | 'Delivered' | 'Invoiced';
export type StopType = 'Pickup' | 'Delivery' | 'Fuel' | 'Rest';

export interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  status: string;
  created_at?: string;
}

export interface Asset {
  id: string;
  unit_number: string;
  type: AssetType;
  make_model?: string;
  vin?: string;
  plate_number?: string;
  status: AssetStatus;
  current_location?: string;
  created_at?: string;
}

export interface Load {
  id: string;
  customer_name: string;
  pickup_date?: string;
  delivery_date?: string;
  rate?: number;
  distance_miles?: number;
  weight_lbs?: number;
  commodity?: string;
  status: LoadStatus;
  notes?: string;
  created_at?: string;
}

export interface Trip {
  id: string;
  driver_id?: string;
  truck_id?: string;
  trailer_id?: string;
  status: TripStatus;
  start_time?: string;
  end_time?: string;
  total_miles?: number;
  driver?: Driver;
  truck?: Asset;
  trailer?: Asset;
}

export interface Stop {
  id: string;
  trip_id: string;
  load_id?: string;
  stop_sequence: number;
  type: StopType;
  location_name: string;
  address: string;
  scheduled_time?: string;
}