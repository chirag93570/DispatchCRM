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

  async logCall(data: Partial<CallLog>): Promise<void> {
    // Fetch company info if not provided but leadId is
    let companyName = data.companyName || 'Unknown';
    let phoneNumber = data.phoneNumber || '';

    if (data.leadId && (!data.companyName || !data.phoneNumber)) {
        const { data: lead } = await supabase.from('leads').select('company_name, phone_number').eq('id', data.leadId).single();
        if (lead) {
            companyName = lead.company_name;
            phoneNumber = lead.phone_number;
        }
    }

    await supabase.from('call_logs').insert({
      lead_id: data.leadId,
      company_name: companyName,
      phone_number: phoneNumber,
      outcome: data.outcome,
      note: data.note,
      duration_seconds: data.durationSeconds,
      recording_url: data.recordingUrl
    });
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
    // In a real production app, you would likely use Postgres aggregation queries or RPCs
    // For simplicity here, we are fetching counts.
    
    // Note: This is expensive at scale. Use Supabase aggregation in production.
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: leadsInQueue } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['NEW', 'RETRY']);
    const { count: callsToday } = await supabase.from('call_logs').select('*', { count: 'exact', head: true }).gte('timestamp', new Date().toISOString().split('T')[0]);

    return {
      totalCallsToday: callsToday || 0,
      interestedLeads: 0, // Placeholder: requires complex query
      retryQueue: 0, // Placeholder
      dncCount: 0,
      totalLeads: totalLeads || 0,
      leadsInQueue: leadsInQueue || 0,
      onboardedCount: 0,
      avgTalkTime: 0
    };
  }
}

export const leadService = new LeadService();
