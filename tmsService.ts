import { supabase } from './services/supabase';
import { Driver, Asset, Load, Trip, Stop } from './types';

class TmsService {
  
  // --- DRIVERS ---
  async getDrivers(): Promise<Driver[]> {
    const { data, error } = await supabase.from('drivers').select('*').order('name');
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async addDriver(driver: Partial<Driver>): Promise<void> {
    const { error } = await supabase.from('drivers').insert(driver);
    if (error) throw error;
  }

  // --- ASSETS (Trucks/Trailers) ---
  async getAssets(): Promise<Asset[]> {
    const { data, error } = await supabase.from('assets').select('*').order('unit_number');
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async addAsset(asset: Partial<Asset>): Promise<void> {
    const { error } = await supabase.from('assets').insert(asset);
    if (error) throw error;
  }

  // --- LOADS ---
  async getLoads(): Promise<Load[]> {
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async addLoad(load: Partial<Load>): Promise<void> {
    const { error } = await supabase.from('loads').insert(load);
    if (error) throw error;
  }

  // --- TRIPS (Dispatch Logic) ---
  async getTrips(): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        driver:drivers(*),
        truck:assets!trips_truck_id_fkey(*),
        trailer:assets!trips_trailer_id_fkey(*)
      `)
      .order('start_time', { ascending: false });
      
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async createTrip(tripData: Partial<Trip>): Promise<string | null> {
    const { data, error } = await supabase.from('trips').insert(tripData).select().single();
    if (error) throw error;
    return data ? data.id : null;
  }
}

export const tmsService = new TmsService();