import { supabase } from './supabase';
import { Lead, LeadStatus, CallLog, Opportunity, SalesStage } from '../types';

class LeadService {
  
  // --- Leads ---

  async getAllLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        notes (
          id, content, timestamp
        )
      `)
      .order('last_call_time', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    // Map snake_case DB columns to camelCase types
    return data.map((l: any) => ({
      id: l.id,
      serialNumber: l.serial_number,
      companyName: l.company_name,
      mcNumber: l.mc_number,
      phoneNumber: l.phone_number,
      email: l.email,
      status: l.status as LeadStatus,
      state: l.state,
      truckCount: l.truck_count,
      lastCallTime: l.last_call_time,
      notes: l.notes || []
    }));
  }
  async updateLeadDetails(id: string, updates: any): Promise<void> {
    const { error } = await supabase.from('leads').update({
        company_name: updates.companyName,
        phone_number: updates.phoneNumber,
        email: updates.email,
        state: updates.state,
        truck_count: updates.truckCount,
        mc_number: updates.mcNumber
    }).eq('id', id);
    if (error) throw error;
  }
  async getNextLead(): Promise<Lead | null> {
    // Priority: RETRY > NEW > Others (excluding dead leads)
    const { data, error } = await supabase
      .from('leads')
      .select(`*, notes(id, content, timestamp)`)
      .in('status', ['RETRY', 'NEW'])
      .order('status', { ascending: false }) // 'RETRY' > 'NEW' alphabetically, works coincidentally or needs custom sort
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      serialNumber: data.serial_number,
      companyName: data.company_name,
      mcNumber: data.mc_number,
      phoneNumber: data.phone_number,
      email: data.email,
      status: data.status as LeadStatus,
      state: data.state,
      truckCount: data.truck_count,
      lastCallTime: data.last_call_time,
      notes: data.notes || []
    };
  }

  async addLead(leadData: Partial<Lead>): Promise<void> {
    const { error } = await supabase.from('leads').insert({
      company_name: leadData.companyName,
      mc_number: leadData.mcNumber,
      phone_number: leadData.phoneNumber,
      email: leadData.email,
      state: leadData.state,
      truck_count: leadData.truckCount,
      status: LeadStatus.NEW
    });

    if (error) throw error;
  }

  async bulkImportLeads(leadsData: any[]): Promise<number> {
    const formatted = leadsData.map(l => ({
      company_name: l.companyName,
      mc_number: l.mcNumber,
      phone_number: l.phoneNumber,
      email: l.email,
      state: l.state,
      truck_count: l.truckCount,
      status: LeadStatus.NEW
    }));

    const { data, error } = await supabase.from('leads').insert(formatted).select();
    if (error) throw error;
    return data.length;
  }
  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  }

  async addOpportunity(opp: Partial<Opportunity>): Promise<void> {
    const { error } = await supabase.from('opportunities').insert({
      title: opp.title,
      company_name: opp.companyName,
      value: opp.value,
      stage: SalesStage.PROSPECTING,
      owner: 'Agent', 
      next_action: opp.nextAction,
      expected_close_date: opp.expectedCloseDate,
      probability: 20 
    });
    if (error) throw error;
  }
  async updateLeadStatus(id: string, status: LeadStatus, newNote?: string): Promise<void> {
    const timestamp = new Date().toISOString();

    // 1. Update Lead Status
    const { error: leadError } = await supabase
      .from('leads')
      .update({ status, last_call_time: timestamp })
      .eq('id', id);

    if (leadError) throw leadError;

    // 2. Insert Note if exists
    if (newNote) {
      await supabase.from('notes').insert({
        lead_id: id,
        content: newNote,
        timestamp: timestamp
      });

      // 3. Log Call implicitly
      this.logCall({
        leadId: id,
        outcome: status,
        note: newNote,
        durationSeconds: 0 // Default, real dialer updates this later
      });
    }
  }

  // --- Opportunities ---

  async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase.from('opportunities').select('*');
    if (error) return [];
    
    return data.map((o: any) => ({
      id: o.id,
      title: o.title,
      companyName: o.company_name,
      value: o.value,
      stage: o.stage as SalesStage,
      owner: o.owner,
      nextAction: o.next_action,
      expectedCloseDate: o.expected_close_date,
      probability: o.probability
    }));
  }

  async updateOpportunityStage(id: string, stage: SalesStage): Promise<void> {
    await supabase.from('opportunities').update({ stage }).eq('id', id);
  }
  
  // --- Calls ---

  async logCall(log: { phoneNumber: string, outcome: string, durationSeconds: number, note: string, recordingUrl?: string }): Promise<void> {
    const { error } = await supabase.from('call_logs').insert({
      phone_number: log.phoneNumber,
      outcome: log.outcome,
      duration_seconds: log.durationSeconds,
      notes: log.note,
      recording_url: log.recordingUrl // This saves the link!
    });
    if (error) console.error("Error logging call:", error);
  }

  async getCallHistory(): Promise<CallLog[]> {
    const { data, error } = await supabase.from('call_logs').select('*').order('timestamp', { ascending: false });
    if (error) return [];

    return data.map((l: any) => ({
      id: l.id,
      leadId: l.lead_id,
      companyName: l.company_name,
      phoneNumber: l.phone_number,
      outcome: l.outcome,
      note: l.note,
      timestamp: l.timestamp,
      durationSeconds: l.duration_seconds,
      recordingUrl: l.recording_url
    }));
  }

  async getStats(): Promise<any> {
    // 1. Get fundamental counts
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: leadsInQueue } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['NEW', 'RETRY']);
    
    // 2. Calculate Real Pipeline Value & Win Rate
    const { data: opportunities } = await supabase.from('opportunities').select('value, stage');
    
    let pipelineValue = 0;
    let wonCount = 0;
    let lostCount = 0;

    if (opportunities) {
        opportunities.forEach(opp => {
            // Sum up value of all active deals (not won/lost)
            if (opp.stage !== 'Won' && opp.stage !== 'Lost') {
                pipelineValue += (opp.value || 0);
            }
            if (opp.stage === 'Won') wonCount++;
            if (opp.stage === 'Lost') lostCount++;
        });
    }

    // Calculate Win Rate %
    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;

    // 3. Get Call Logs for Activity
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: callsTodayData } = await supabase
        .from('call_logs')
        .select('duration_seconds')
        .gte('timestamp', todayStr);

    const callsTodayCount = callsTodayData ? callsTodayData.length : 0;
    
    // Calculate Average Talk Time
    let avgTime = 0;
    if (callsTodayCount > 0 && callsTodayData) {
        const totalSeconds = callsTodayData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
        avgTime = Math.round(totalSeconds / callsTodayCount);
    }

    return {
      totalCallsToday: callsTodayCount,
      interestedLeads: 0, 
      retryQueue: 0, 
      dncCount: 0, 
      totalLeads: totalLeads || 0, 
      leadsInQueue: leadsInQueue || 0, 
      onboardedCount: wonCount, // Use won deals as onboarded
      avgTalkTime: avgTime,
      // NEW REAL STATS
      pipelineValue: pipelineValue,
      winRate: winRate,
      activeDeals: opportunities ? opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length : 0
    };
  }
}

export const leadService = new LeadService();
