"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export interface Child {
  id: string;
  name: string;
  household_id: string;
}

export interface Device {
  id: string;
  name: string;
  type: "phone" | "tablet" | "laptop" | "gaming" | "tv";
  household_id: string;
  assigned_to: string | null;
  pairing_code: string;
  paired: boolean;
  status: "active" | "idle" | "blocked";
}

export interface Schedule {
  id: string;
  name: string;
  household_id: string;
  time_start: string;
  time_end: string;
  days: string[];
  pause_notifications: boolean;
  lock_entertainment: boolean;
  status: "active" | "scheduled" | "paused";
  icon: string;
  created_by: string;
  device_ids?: string[];
}

interface DataContextType {
  householdId: string | null;
  householdName: string | null;
  inviteCode: string | null;
  children: Child[];
  devices: Device[];
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  createHousehold: (name: string) => Promise<void>;
  addChild: (name: string) => Promise<void>;
  removeChild: (id: string) => Promise<void>;
  addDevice: (name: string, type: Device["type"]) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  createSchedule: (data: Omit<Schedule, "id" | "household_id" | "created_by">, deviceIds: string[]) => Promise<void>;
  updateSchedule: (id: string, data: Partial<Schedule>, deviceIds?: string[]) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  activateSchedule: (id: string) => Promise<void>;
  deactivateSchedule: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdName, setHouseholdName] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (hId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [childRes, deviceRes, scheduleRes, householdRes] = await Promise.all([
        supabase.from("children").select("*").eq("household_id", hId),
        supabase.from("devices").select("*").eq("household_id", hId),
        supabase.from("schedules").select("*").eq("household_id", hId),
        supabase.from("households").select("*").eq("id", hId).single(),
      ]);

      if (childRes.data) setChildren(childRes.data);
      if (deviceRes.data) setDevices(deviceRes.data);
      if (householdRes.data) {
        setHouseholdName(householdRes.data.name);
        setInviteCode(householdRes.data.invite_code);
      }

      if (scheduleRes.data) {
        // Fetch device associations for each schedule
        const schedulesWithDevices = await Promise.all(
          scheduleRes.data.map(async (s: Schedule) => {
            const { data: sd } = await supabase
              .from("schedule_devices")
              .select("device_id")
              .eq("schedule_id", s.id);
            return { ...s, device_ids: sd?.map((d: { device_id: string }) => d.device_id) || [] };
          })
        );
        setSchedules(schedulesWithDevices);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.household_id) {
      setHouseholdId(profile.household_id);
      fetchData(profile.household_id);
    }
  }, [profile, fetchData]);

  const createHousehold = async (name: string) => {
    if (!user) return;
    const { data, error: err } = await supabase
      .from("households")
      .insert({ name, created_by: user.id })
      .select()
      .single();

    if (err) throw err;

    // Update profile with household_id
    await supabase
      .from("profiles")
      .update({ household_id: data.id, role: "parent" })
      .eq("id", user.id);

    setHouseholdId(data.id);
    setHouseholdName(data.name);
    setInviteCode(data.invite_code);
    await refreshProfile();
  };

  const addChild = async (name: string) => {
    if (!householdId) return;
    const { data, error: err } = await supabase
      .from("children")
      .insert({ name, household_id: householdId })
      .select()
      .single();

    if (err) throw err;
    if (data) setChildren((prev) => [...prev, data]);
  };

  const removeChild = async (id: string) => {
    const { error: err } = await supabase.from("children").delete().eq("id", id);
    if (err) throw err;
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const addDevice = async (name: string, type: Device["type"]) => {
    if (!householdId) return;
    const { data, error: err } = await supabase
      .from("devices")
      .insert({ name, type, household_id: householdId })
      .select()
      .single();

    if (err) throw err;
    if (data) setDevices((prev) => [...prev, data]);
  };

  const removeDevice = async (id: string) => {
    const { error: err } = await supabase.from("devices").delete().eq("id", id);
    if (err) throw err;
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  const createSchedule = async (
    data: Omit<Schedule, "id" | "household_id" | "created_by">,
    deviceIds: string[]
  ) => {
    if (!householdId || !user) return;
    const { data: schedule, error: err } = await supabase
      .from("schedules")
      .insert({
        name: data.name,
        household_id: householdId,
        time_start: data.time_start,
        time_end: data.time_end,
        days: data.days,
        pause_notifications: data.pause_notifications,
        lock_entertainment: data.lock_entertainment,
        status: data.status,
        icon: data.icon,
        created_by: user.id,
      })
      .select()
      .single();

    if (err) throw err;

    if (schedule && deviceIds.length > 0) {
      await supabase.from("schedule_devices").insert(
        deviceIds.map((did) => ({ schedule_id: schedule.id, device_id: did }))
      );
    }

    if (schedule) {
      setSchedules((prev) => [...prev, { ...schedule, device_ids: deviceIds }]);
    }
  };

  const updateSchedule = async (id: string, data: Partial<Schedule>, deviceIds?: string[]) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.time_start !== undefined) updateData.time_start = data.time_start;
    if (data.time_end !== undefined) updateData.time_end = data.time_end;
    if (data.days !== undefined) updateData.days = data.days;
    if (data.pause_notifications !== undefined) updateData.pause_notifications = data.pause_notifications;
    if (data.lock_entertainment !== undefined) updateData.lock_entertainment = data.lock_entertainment;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.icon !== undefined) updateData.icon = data.icon;

    const { error: err } = await supabase.from("schedules").update(updateData).eq("id", id);
    if (err) throw err;

    if (deviceIds) {
      await supabase.from("schedule_devices").delete().eq("schedule_id", id);
      if (deviceIds.length > 0) {
        await supabase.from("schedule_devices").insert(
          deviceIds.map((did) => ({ schedule_id: id, device_id: did }))
        );
      }
    }

    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updateData, device_ids: deviceIds || s.device_ids } : s
      )
    );
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from("schedule_devices").delete().eq("schedule_id", id);
    const { error: err } = await supabase.from("schedules").delete().eq("id", id);
    if (err) throw err;
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const activateSchedule = async (id: string) => {
    // Set schedule to active
    await updateSchedule(id, { status: "active" });

    // Block all devices in this schedule
    const schedule = schedules.find((s) => s.id === id);
    if (schedule?.device_ids) {
      for (const deviceId of schedule.device_ids) {
        await supabase.from("enforcement_status").upsert({
          device_id: deviceId,
          is_blocked: true,
          active_schedule_id: id,
          blocked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        await supabase.from("devices").update({ status: "blocked" }).eq("id", deviceId);
      }
    }

    // Update local state
    setDevices((prev) =>
      prev.map((d) =>
        schedule?.device_ids?.includes(d.id) ? { ...d, status: "blocked" as const } : d
      )
    );
  };

  const deactivateSchedule = async (id: string) => {
    await updateSchedule(id, { status: "scheduled" });

    const schedule = schedules.find((s) => s.id === id);
    if (schedule?.device_ids) {
      for (const deviceId of schedule.device_ids) {
        await supabase.from("enforcement_status").upsert({
          device_id: deviceId,
          is_blocked: false,
          active_schedule_id: null,
          updated_at: new Date().toISOString(),
        });
        await supabase.from("devices").update({ status: "idle" }).eq("id", deviceId);
      }
    }

    setDevices((prev) =>
      prev.map((d) =>
        schedule?.device_ids?.includes(d.id) ? { ...d, status: "idle" as const } : d
      )
    );
  };

  const refresh = async () => {
    if (householdId) await fetchData(householdId);
  };

  return (
    <DataContext.Provider
      value={{
        householdId,
        householdName,
        inviteCode,
        children,
        devices,
        schedules,
        loading,
        error,
        createHousehold,
        addChild,
        removeChild,
        addDevice,
        removeDevice,
        createSchedule,
        updateSchedule,
        deleteSchedule,
        activateSchedule,
        deactivateSchedule,
        refresh,
      }}
    >
      {reactChildren}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
