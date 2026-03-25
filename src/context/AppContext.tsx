"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface Child {
  id: string;
  name: string;
}

export interface Device {
  id: string;
  name: string;
  type: "phone" | "tablet" | "laptop" | "gaming" | "tv";
  assignedTo?: string;
  status: "active" | "paused" | "idle";
  routines: string[];
}

export interface Schedule {
  id: string;
  name: string;
  timeStart: string;
  timeEnd: string;
  devices: string[];
  pauseNotifications: boolean;
  lockEntertainment: boolean;
  status: "active" | "scheduled" | "paused";
  icon: string;
  days?: string[];
}

type Screen =
  | "welcome"
  | "family-setup"
  | "dashboard"
  | "create-schedule"
  | "active-focus"
  | "devices"
  | "weekly"
  | "settings";

const defaultSchedules: Schedule[] = [
  {
    id: "1",
    name: "Homework Focus Mode",
    timeStart: "15:00",
    timeEnd: "17:00",
    devices: ["1", "2"],
    pauseNotifications: true,
    lockEntertainment: true,
    status: "active",
    icon: "BookOpen",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: "2",
    name: "Bedtime Shutdown",
    timeStart: "21:00",
    timeEnd: "07:00",
    devices: ["1", "2", "3"],
    pauseNotifications: true,
    lockEntertainment: true,
    status: "scheduled",
    icon: "Moon",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  {
    id: "3",
    name: "Family Dinner Pause",
    timeStart: "18:00",
    timeEnd: "19:00",
    devices: ["1", "2", "3", "4"],
    pauseNotifications: true,
    lockEntertainment: false,
    status: "scheduled",
    icon: "Utensils",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  {
    id: "4",
    name: "Device-Free Time",
    timeStart: "10:00",
    timeEnd: "12:00",
    devices: ["1", "2"],
    pauseNotifications: true,
    lockEntertainment: true,
    status: "scheduled",
    icon: "SmartphoneCharging",
    days: ["Sat", "Sun"],
  },
];

const defaultDevices: Device[] = [
  { id: "1", name: "Emma's iPhone", type: "phone", assignedTo: "Emma", status: "active", routines: ["Homework Focus Mode", "Bedtime Shutdown"] },
  { id: "2", name: "Jacob's Tablet", type: "tablet", assignedTo: "Jacob", status: "paused", routines: ["Homework Focus Mode"] },
  { id: "3", name: "Family Xbox", type: "gaming", status: "idle", routines: ["Bedtime Shutdown", "Family Dinner Pause"] },
  { id: "4", name: "Living Room Smart TV", type: "tv", status: "idle", routines: ["Family Dinner Pause"] },
];

const defaultChildren: Child[] = [
  { id: "1", name: "Emma" },
  { id: "2", name: "Jacob" },
];

interface AppContextType {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  children: Child[];
  addChild: (name: string) => void;
  removeChild: (id: string) => void;
  devices: Device[];
  addDevice: (name: string, type: Device["type"]) => void;
  removeDevice: (id: string) => void;
  schedules: Schedule[];
  addSchedule: (schedule: Omit<Schedule, "id">) => void;
  updateSchedule: (schedule: Schedule) => void;
  activeSchedule: Schedule | null;
  setActiveSchedule: (schedule: Schedule | null) => void;
  editingSchedule: Schedule | null;
  setEditingSchedule: (schedule: Schedule | null) => void;
  initialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children: reactChildren }: { children: React.ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("welcome");
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [devicesList, setDevicesList] = useState<Device[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setScreen = useCallback((screen: Screen) => {
    if ((screen === "dashboard" || screen === "devices" || screen === "weekly" || screen === "settings") && !initialized) {
      setChildrenList(defaultChildren);
      setDevicesList(defaultDevices);
      setSchedules(defaultSchedules);
      setActiveSchedule(defaultSchedules[0]);
      setInitialized(true);
    }
    setCurrentScreen(screen);
  }, [initialized]);

  const addChild = useCallback((name: string) => {
    setChildrenList((prev) => [...prev, { id: Date.now().toString(), name }]);
  }, []);

  const removeChild = useCallback((id: string) => {
    setChildrenList((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addDevice = useCallback((name: string, type: Device["type"]) => {
    setDevicesList((prev) => [
      ...prev,
      { id: Date.now().toString(), name, type, status: "idle", routines: [] },
    ]);
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevicesList((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const addSchedule = useCallback((schedule: Omit<Schedule, "id">) => {
    setSchedules((prev) => [...prev, { ...schedule, id: Date.now().toString() }]);
  }, []);

  const updateSchedule = useCallback((schedule: Schedule) => {
    setSchedules((prev) => prev.map((s) => (s.id === schedule.id ? schedule : s)));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setScreen,
        children: childrenList,
        addChild,
        removeChild,
        devices: devicesList,
        addDevice,
        removeDevice,
        schedules,
        addSchedule,
        updateSchedule,
        activeSchedule,
        setActiveSchedule,
        editingSchedule,
        setEditingSchedule,
        initialized,
      }}
    >
      {reactChildren}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
