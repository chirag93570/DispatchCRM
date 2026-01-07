import { Lead, LeadStatus, Note, DashboardStats, CallLog, Opportunity, SalesStage } from '../types';
import { MOCK_LEADS, MOCK_OPPORTUNITIES } from '../mockData';

class LeadService {
  private leads: Lead[] = [...MOCK_LEADS];
  private opportunities: Opportunity[] = [...MOCK_OPPORTUNITIES];
  private callLogs: CallLog[] = [];
  private nextSerialNumber: number = 10;

  constructor() {
      // Seed some call logs
      this.callLogs = [
          { id: '101', leadId: '1', companyName: 'Apex Logistics', phoneNumber: '(555) 123-4567', outcome: 'No Answer', note: 'Voicemail', timestamp: new Date().toISOString(), durationSeconds: 0, recordingUrl: '' },
          { id: '102', leadId: '2', companyName: 'Blue Horizon', phoneNumber: '(555) 987-6543', outcome: 'Connected', note: 'Good talk', timestamp: new Date(Date.now() - 3600000).toISOString(), durationSeconds: 145, recordingUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
      ];
  }

  private async delay(ms: number = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Leads ---

  async getAllLeads(): Promise<Lead[]> {
    await this.delay(100);
    return [...this.leads];
  }

  // Legacy method kept for compatibility, now just aliases getAllLeads or standard sort
  async getLeadsDFS(): Promise<Lead[]> {
      return this.getAllLeads();
  }

  // Standard Priority Queue: Retries first, then New
  async getNextLead(): Promise<Lead | null> {
    await this.delay(100);
    
    const retryLead = this.leads.find(l => l.status === LeadStatus.RETRY);
    if (retryLead) return { ...retryLead };

    const newLead = this.leads.find(l => l.status === LeadStatus.NEW);
    if (newLead) return { ...newLead };
    
    // Fallback
    const next = this.leads.find(l => 
        l.status !== LeadStatus.DNC && 
        l.status !== LeadStatus.BOOKED && 
        l.status !== LeadStatus.DISCONNECTED_NUMBER &&
        l.status !== LeadStatus.WRONG_NUMBER &&
        l.status !== LeadStatus.ONBOARDED &&
        l.status !== LeadStatus.NOT_INTERESTED
    );
    return next ? { ...next } : null;
  }

  async addLead(leadData: Partial<Lead>): Promise<Lead> {
    await this.delay(300);
    if (leadData.mcNumber && this.leads.some(l => l.mcNumber === leadData.mcNumber)) {
        throw new Error(`Lead with MC# ${leadData.mcNumber} already exists.`);
    }

    const newLead: Lead = {
      id: Date.now().toString(),
      serialNumber: this.nextSerialNumber++,
      companyName: leadData.companyName || 'Unknown',
      mcNumber: leadData.mcNumber || 'N/A',
      phoneNumber: leadData.phoneNumber || '',
      email: leadData.email || '',
      status: LeadStatus.NEW,
      state: leadData.state || '',
      truckCount: leadData.truckCount || 0,
      notes: [],
      ...leadData 
    } as Lead;

    this.leads.unshift(newLead);
    return newLead;
  }

  async bulkImportLeads(leadsData: any[]): Promise<number> {
    await this.delay(500);
    let count = 0;
    for (const row of leadsData) {
      if (!row.mcNumber || this.leads.some(l => l.mcNumber === row.mcNumber)) continue;
      this.leads.unshift({
        id: Date.now().toString() + Math.random(),
        serialNumber: this.nextSerialNumber++,
        companyName: row.companyName || 'Unknown',
        mcNumber: row.mcNumber,
        phoneNumber: row.phoneNumber || '',
        email: row.email || '',
        state: row.state || '',
        truckCount: Number(row.truckCount) || 0,
        status: LeadStatus.NEW,
        notes: []
      });
      count++;
    }
    return count;
  }

  async updateLeadStatus(id: string, status: LeadStatus, newNote?: string): Promise<Lead> {
    await this.delay(200);
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Lead not found');

    const lead = this.leads[index];
    const timestamp = new Date().toISOString();

    const updatedNotes = newNote 
      ? [...lead.notes, { id: Date.now().toString(), content: newNote, timestamp }] 
      : lead.notes;

    // Log the call automatically if note provided (implies interaction)
    if (newNote) {
        this.logCall({
            leadId: lead.id,
            companyName: lead.companyName,
            phoneNumber: lead.phoneNumber,
            outcome: status,
            note: newNote || '',
            durationSeconds: Math.floor(Math.random() * 300) // Mock duration
        });
    }

    const updatedLead: Lead = {
      ...lead,
      status,
      lastCallTime: timestamp,
      notes: updatedNotes
    };

    this.leads[index] = updatedLead;
    return { ...updatedLead };
  }

  // --- Opportunities ---

  async getOpportunities(): Promise<Opportunity[]> {
      await this.delay(100);
      return [...this.opportunities];
  }

  async updateOpportunityStage(id: string, stage: SalesStage): Promise<Opportunity> {
      await this.delay(100);
      const index = this.opportunities.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Opportunity not found');

      // Update probability based on stage (simple rule)
      let prob = 0;
      switch(stage) {
          case SalesStage.PROSPECTING: prob = 10; break;
          case SalesStage.QUALIFICATION: prob = 20; break;
          case SalesStage.DISCOVERY: prob = 40; break;
          case SalesStage.PROPOSAL: prob = 60; break;
          case SalesStage.NEGOTIATION: prob = 80; break;
          case SalesStage.WON: prob = 100; break;
          case SalesStage.LOST: prob = 0; break;
      }

      const updated = { ...this.opportunities[index], stage, probability: prob };
      this.opportunities[index] = updated;
      return updated;
  }

  // --- Calls ---

  async logCall(data: Partial<CallLog>): Promise<void> {
      // Generate a mock recording URL for connected calls > 5 seconds
      let mockRecording = '';
      if (data.durationSeconds && data.durationSeconds > 5) {
          mockRecording = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      }

      const logEntry: CallLog = {
          id: Date.now().toString(),
          leadId: data.leadId || null,
          companyName: data.companyName || 'Unknown / Manual',
          phoneNumber: data.phoneNumber || '',
          outcome: data.outcome || 'Completed',
          note: data.note || '',
          timestamp: new Date().toISOString(),
          durationSeconds: data.durationSeconds || 0,
          recordingUrl: mockRecording
      };
      this.callLogs.unshift(logEntry);
  }

  async getCallHistory(): Promise<CallLog[]> {
    await this.delay(100);
    return [...this.callLogs];
  }

  async getStats(): Promise<DashboardStats> {
    const today = new Date().toDateString();
    const todaysLogs = this.callLogs.filter(log => new Date(log.timestamp).toDateString() === today);
    const totalDuration = todaysLogs.reduce((acc, curr) => acc + curr.durationSeconds, 0);

    return {
      totalCallsToday: todaysLogs.length,
      interestedLeads: this.leads.filter(l => l.status === LeadStatus.INTERESTED).length,
      retryQueue: this.leads.filter(l => l.status === LeadStatus.RETRY).length,
      dncCount: this.leads.filter(l => l.status === LeadStatus.DNC).length,
      totalLeads: this.leads.length,
      leadsInQueue: this.leads.filter(l => l.status === LeadStatus.NEW || l.status === LeadStatus.RETRY).length,
      onboardedCount: this.leads.filter(l => l.status === LeadStatus.ONBOARDED).length,
      avgTalkTime: todaysLogs.length ? Math.floor(totalDuration / todaysLogs.length) : 0
    };
  }
}

export const leadService = new LeadService();
