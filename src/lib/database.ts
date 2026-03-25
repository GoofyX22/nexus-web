import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface Child {
  id: string;
  household_id: string;
  name: string;
  created_at: string;
}

export interface Device {
  id: string;
  household_id: string;
  name: string;
  type: string;
  pairing_code: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  household_id: string;
  name: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface ScheduleDevice {
  schedule_id: string;
  device_id: string;
}

export interface EnforcementStatus {
  id: string;
  device_id: string;
  is_blocked: boolean;
  schedule_id: string | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Households
// ---------------------------------------------------------------------------

export async function createHousehold(name: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .insert({ name })
    .select()
    .single();

  if (error) throw error;
  return data as Household;
}

export async function getHousehold(id: string): Promise<Household> {
  const { data, error } = await supabase
    .from('households')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Household;
}

export async function getMyHousehold(): Promise<Household> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Not authenticated.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;
  if (!profile?.household_id) throw new Error('No household associated with this account.');

  return getHousehold(profile.household_id);
}

// ---------------------------------------------------------------------------
// Children
// ---------------------------------------------------------------------------

export async function addChild(
  householdId: string,
  name: string
): Promise<Child> {
  const { data, error } = await supabase
    .from('children')
    .insert({ household_id: householdId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Child;
}

export async function getChildren(householdId: string): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Child[];
}

export async function removeChild(id: string): Promise<void> {
  const { error } = await supabase.from('children').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export async function addDevice(
  householdId: string,
  name: string,
  type: string
): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .insert({ household_id: householdId, name, type })
    .select()
    .single();

  if (error) throw error;
  return data as Device;
}

export async function getDevices(householdId: string): Promise<Device[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Device[];
}

export async function removeDevice(id: string): Promise<void> {
  const { error } = await supabase.from('devices').delete().eq('id', id);
  if (error) throw error;
}

export async function pairDevice(pairingCode: string): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('pairing_code', pairingCode)
    .single();

  if (error) throw error;
  return data as Device;
}

export async function getDeviceByPairingCode(code: string): Promise<Device> {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('pairing_code', code)
    .single();

  if (error) throw error;
  return data as Device;
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

export async function createSchedule(
  scheduleData: Omit<Schedule, 'id' | 'created_at'>
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .insert(scheduleData)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function getSchedules(householdId: string): Promise<Schedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Schedule[];
}

export async function updateSchedule(
  id: string,
  updates: Partial<Omit<Schedule, 'id' | 'created_at'>>
): Promise<Schedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Schedule;
}

export async function deleteSchedule(id: string): Promise<void> {
  const { error } = await supabase.from('schedules').delete().eq('id', id);
  if (error) throw error;
}

export async function getScheduleDevices(
  scheduleId: string
): Promise<ScheduleDevice[]> {
  const { data, error } = await supabase
    .from('schedule_devices')
    .select('*')
    .eq('schedule_id', scheduleId);

  if (error) throw error;
  return data as ScheduleDevice[];
}

export async function setScheduleDevices(
  scheduleId: string,
  deviceIds: string[]
): Promise<void> {
  // Remove existing associations
  const { error: deleteError } = await supabase
    .from('schedule_devices')
    .delete()
    .eq('schedule_id', scheduleId);

  if (deleteError) throw deleteError;

  // Insert new associations
  if (deviceIds.length > 0) {
    const rows = deviceIds.map((deviceId) => ({
      schedule_id: scheduleId,
      device_id: deviceId,
    }));

    const { error: insertError } = await supabase
      .from('schedule_devices')
      .insert(rows);

    if (insertError) throw insertError;
  }
}

// ---------------------------------------------------------------------------
// Enforcement
// ---------------------------------------------------------------------------

export async function getEnforcementStatus(
  deviceId: string
): Promise<EnforcementStatus> {
  const { data, error } = await supabase
    .from('enforcement_status')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error) throw error;
  return data as EnforcementStatus;
}

export async function setEnforcementStatus(
  deviceId: string,
  isBlocked: boolean,
  scheduleId: string | null = null
): Promise<EnforcementStatus> {
  const { data, error } = await supabase
    .from('enforcement_status')
    .upsert(
      {
        device_id: deviceId,
        is_blocked: isBlocked,
        schedule_id: scheduleId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'device_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as EnforcementStatus;
}

export function subscribeToEnforcement(
  deviceId: string,
  callback: (status: EnforcementStatus) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`enforcement:${deviceId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'enforcement_status',
        filter: `device_id=eq.${deviceId}`,
      },
      (payload) => {
        callback(payload.new as EnforcementStatus);
      }
    )
    .subscribe();

  return channel;
}
