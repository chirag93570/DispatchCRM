import { supabase } from './supabase';
import { Lead, LeadStatus, CallLog, Opportunity, SalesStage } from '../types';
import * as XLSX from 'xlsx';

// YOUR TELNYX KEY
const TELNYX_API_KEY = "PASTE_YOUR_NEW_KEY_HERE"; 
const TELNYX_BASE_URL = "/telnyx-proxy/v2";

class LeadService {
  
  // --- Leads ---

  async getAllLeads(): Promise<Lead[]> {
    // FIXED: Added .range(0, 19999) to fetch up to 20,000 leads
    // Without this, Supabase stops at 1,000.
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        notes (
          id, content, timestamp
        )
      `)
      .order('created_at', { ascending: false }) 
      .range(0, 19999); 

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return data.map((l: any) => ({
      id: l.id,
      serialNumber: l.serial_number,
      companyName: l.company_name,
      mcNumber: l.mc_number,
      dotNumber: l.dot_number,
      phoneNumber: l.phone_number,
      email: l.email,
      status: l.status as LeadStatus,
      state: l.state,
      truckCount: l.truck_count,
      lastCallTime: l.last_call_time,
      notes: l.notes || [],
      source: l.source || 'Upload',
      address: l.address
    }));
  }

  async updateLeadDetails(id: string, updates: any): Promise<void> {
    const { error } = await supabase.from('leads').update({
        company_name: updates.companyName,
        phone_number: updates.phoneNumber,
        email: updates.email,
        state: updates.state,
        truck_count: updates.truckCount,
        mc_number: updates.mcNumber,
        dot_number: updates.dotNumber,
        source: updates.source,
        address: updates.address
    }).eq('id', id);
    if (error) throw error;
  }

  async getNextLead(): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select(`*, notes(id, content, timestamp)`)
      .in('status', ['RETRY', 'NEW'])
      .order('status', { ascending: false }) 
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      serialNumber: data.serial_number,
      companyName: data.company_name,
      mcNumber: data.mc_number,
      dotNumber: data.dot_number,
      phoneNumber: data.phone_number,
      email: data.email,
      status: data.status as LeadStatus,
      state: data.state,
      truckCount: data.truck_count,
      lastCallTime: data.last_call_time,
      notes: data.notes || [],
      source: data.source
    };
  }

  async addLead(leadData: Partial<Lead>): Promise<void> {
    const { error } = await supabase.from('leads').insert({
      company_name: leadData.companyName,
      mc_number: leadData.mcNumber,
      dot_number: leadData.dotNumber,
      phone_number: leadData.phoneNumber,
      email: leadData.email,
      state: leadData.state,
      truck_count: leadData.truckCount,
      status: LeadStatus.NEW,
      source: leadData.source || 'Manual Add'
    });
    if (error) throw error;
  }

  async bulkImportLeads(leadsData: any[], sourceName: string): Promise<number> {
    const formatted = leadsData.map(l => ({
      company_name: l.companyName,
      mc_number: l.mcNumber || '', 
      dot_number: l.dotNumber,     
      phone_number: l.phoneNumber,
      email: l.email,
      state: l.state,
      truck_count: l.truckCount,
      address: l.address,
      status: LeadStatus.NEW,
      source: sourceName
    }));

    const { data, error } = await supabase.from('leads').insert(formatted).select();
    if (error) throw error;
    return data.length;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteLeads(ids: string[]): Promise<void> {
      if (ids.length === 0) return;
      const { error } = await supabase.from('leads').delete().in('id', ids);
      if (error) throw error;
  }

  async deleteLeadsBySource(sourceName: string): Promise<void> {
      const { error } = await supabase.from('leads').delete().eq('source', sourceName);
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
    const { error: leadError } = await supabase.from('leads').update({ status, last_call_time: timestamp }).eq('id', id);
    if (leadError) throw leadError;

    if (newNote) {
      await supabase.from('notes').insert({ lead_id: id, content: newNote, timestamp: timestamp });
      this.logCall({ phoneNumber: '', outcome: status, note: newNote, durationSeconds: 0 });
    }
  }

  async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase.from('opportunities').select('*');
    if (error) return [];
    return data.map((o: any) => ({
      id: o.id, title: o.title, companyName: o.company_name, value: o.value, stage: o.stage as SalesStage,
      owner: o.owner, nextAction: o.next_action, expectedCloseDate: o.expected_close_date, probability: o.probability
    }));
  }

  async updateOpportunityStage(id: string, stage: SalesStage): Promise<void> {
    await supabase.from('opportunities').update({ stage }).eq('id', id);
  }
  
  // --- Calls ---

  async logCall(log: { phoneNumber: string, outcome: string, durationSeconds: number, note: string, recordingUrl?: string }): Promise<void> {
    let leadId = null;
    if(log.phoneNumber) leadId = await this.getLeadIdByPhone(log.phoneNumber);

    const { error } = await supabase.from('call_logs').insert({
      lead_id: leadId, phone_number: log.phoneNumber, outcome: log.outcome,
      duration_seconds: log.durationSeconds, notes: log.note, recording_url: log.recordingUrl 
    });
    if (error) console.error("Error logging call:", error);
  }

  async getCallHistory(): Promise<CallLog[]> {
    const { data, error } = await supabase.from('call_logs').select('*').order('timestamp', { ascending: false });
    if (error) return [];
    return data.map((l: any) => ({
      id: l.id, leadId: l.lead_id, companyName: l.company_name, phoneNumber: l.phone_number,
      outcome: l.outcome, note: l.notes, timestamp: l.created_at || l.timestamp,
      durationSeconds: l.duration_seconds, recordingUrl: l.recording_url
    }));
  }

  // --- AUTOMATION (CSV) ---
  
  async autoSyncTelnyx() {
      console.log("🔄 Starting Auto-Sync from Telnyx (CSV Method)...");
      try {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1); 

          const start = yesterday.toISOString();
          const end = today.toISOString();

          console.log(`1. Requesting CDR Report...`);

          const createResp = await fetch(`${TELNYX_BASE_URL}/reports/cdr_downloads`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${TELNYX_API_KEY}`, 
                  'Content-Type': 'application/json' 
              },
              body: JSON.stringify({
                  start_date: start,
                  end_date: end,
                  filters: {} 
              })
          });

          if (!createResp.ok) {
              const errText = await createResp.text();
              throw new Error(`Telnyx API Error: ${errText}`);
          }

          const createJson = await createResp.json();
          const reportId = createJson.data.id;
          console.log(`2. Report ID: ${reportId}. Waiting for generation...`);

          let downloadUrl = null;
          for (let i = 0; i < 15; i++) {
              await new Promise(r => setTimeout(r, 2000));
              const statusResp = await fetch(`${TELNYX_BASE_URL}/reports/cdr_downloads/${reportId}`, {
                  headers: { 'Authorization': `Bearer ${TELNYX_API_KEY}` }
              });
              const statusJson = await statusResp.json();
              if (statusJson.data.status === 'complete') {
                  downloadUrl = statusJson.data.result_url;
                  break;
              }
              if (statusJson.data.status === 'failed') throw new Error("Telnyx Report Generation Failed.");
          }

          if (!downloadUrl) throw new Error("Report generation timed out.");

          console.log("3. Downloading CSV...");
          const csvResp = await fetch(downloadUrl);
          const blob = await csvResp.blob();
          
          const count = await this.processTelnyxCDR(new File([blob], "autosync.csv"));
          return count;

      } catch (e) {
          console.error("Auto-Sync Failed:", e);
          throw e;
      }
  }

  async processTelnyxCDR(file: File): Promise<number> {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
              try {
                  const data = new Uint8Array(e.target?.result as ArrayBuffer);
                  const workbook = XLSX.read(data, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const sheet = workbook.Sheets[sheetName];
                  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

                  let processedCount = 0;
                  for (const row of rows) {
                      const destination = row['Destination'] || row['Terminating Number'] || row['To'] || row['Cld'] || ''; 
                      const source = row['Originating Number'] || row['From'] || row['Cli'] || '';
                      const duration = row['Duration'] || row['Billable Duration'] || row['Talk Time'] || '0';
                      const date = row['Start Time'] || row['Date'] || row['Created At'];
                      const status = row['Status'] || 'Completed';
                      const direction = row['Direction'] || 'outbound';

                      let leadId = await this.getLeadIdByPhone(destination);
                      if (!leadId) leadId = await this.getLeadIdByPhone(source);

                      if (leadId && date) {
                          const { data: existing } = await supabase
                            .from('call_logs')
                            .select('id')
                            .eq('lead_id', leadId)
                            .eq('created_at', new Date(date).toISOString())
                            .maybeSingle();

                          if (!existing) {
                              await supabase.from('call_logs').insert([{
                                  lead_id: leadId,
                                  phone_number: direction.toLowerCase().includes('out') ? destination : source,
                                  outcome: status,
                                  duration_seconds: parseFloat(duration),
                                  notes: `Telnyx Report: ${direction} call`,
                                  created_at: new Date(date).toISOString()
                              }]);

                              await supabase.from('leads')
                                  .update({ last_call_time: new Date(date).toISOString() })
                                  .eq('id', leadId);
                              
                              processedCount++;
                          }
                      }
                  }
                  resolve(processedCount);
              } catch (err) { reject(err); }
          };
          reader.readAsArrayBuffer(file);
      });
  }

  async getLeadIdByPhone(phone: string): Promise<string | null> {
      if (!phone) return null;
      const clean = phone.toString().replace(/\D/g, '').slice(-10); 
      if (clean.length < 5) return null; 
      const { data } = await supabase.from('leads').select('id').ilike('phone_number', `%${clean}%`).maybeSingle();
      return data ? data.id : null;
  }

  async getStats(): Promise<any> {
    const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { count: leadsInQueue } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['NEW', 'RETRY']);
    const { data: opportunities } = await supabase.from('opportunities').select('value, stage');
    
    let pipelineValue = 0;
    let wonCount = 0;
    let lostCount = 0;

    if (opportunities) {
        opportunities.forEach(opp => {
            if (opp.stage !== 'Won' && opp.stage !== 'Lost') pipelineValue += (opp.value || 0);
            if (opp.stage === 'Won') wonCount++;
            if (opp.stage === 'Lost') lostCount++;
        });
    }

    const totalClosed = wonCount + lostCount;
    const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: callsTodayData } = await supabase.from('call_logs').select('duration_seconds').gte('created_at', todayStr);
    const callsTodayCount = callsTodayData ? callsTodayData.length : 0;
    
    let avgTime = 0;
    if (callsTodayCount > 0 && callsTodayData) {
        const totalSeconds = callsTodayData.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
        avgTime = Math.round(totalSeconds / callsTodayCount);
    }

    return {
      totalCallsToday: callsTodayCount,
      interestedLeads: 0, retryQueue: 0, dncCount: 0, totalLeads: totalLeads || 0, leadsInQueue: leadsInQueue || 0, 
      onboardedCount: wonCount, avgTalkTime: avgTime, pipelineValue: pipelineValue, winRate: winRate,
      activeDeals: opportunities ? opportunities.filter(o => o.stage !== 'Won' && o.stage !== 'Lost').length : 0
    };
  }
}

export const leadService = new LeadService();