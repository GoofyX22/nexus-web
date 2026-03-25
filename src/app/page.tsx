"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider, useData } from "@/context/DataContext";
import BottomNav from "@/components/BottomNav";
import SignInScreen from "@/screens/SignInScreen";
import SignUpScreen from "@/screens/SignUpScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import CreateScheduleScreen from "@/screens/CreateScheduleScreen";
import ActiveFocusScreen from "@/screens/ActiveFocusScreen";
import DeviceOverviewScreen from "@/screens/DeviceOverviewScreen";
import WeeklyRoutineScreen from "@/screens/WeeklyRoutineScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ChildDeviceScreen from "@/screens/ChildDeviceScreen";

type Screen =
  | "dashboard"
  | "create-schedule"
  | "active-focus"
  | "devices"
  | "weekly"
  | "settings"
  | "child-device";

function AuthGate() {
  const [showSignUp, setShowSignUp] = useState(false);
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-2xl font-heading font-bold text-primary">N</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return showSignUp ? (
      <SignUpScreen onSwitch={() => setShowSignUp(false)} />
    ) : (
      <SignInScreen onSwitch={() => setShowSignUp(true)} />
    );
  }

  // User is authenticated
  return (
    <DataProvider>
      <AppRouter />
    </DataProvider>
  );
}

function AppRouter() {
  const { profile } = useAuth();
  const { householdId } = useData();
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const setScreen = (s: string) => setCurrentScreen(s as Screen);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  // If no household yet, show onboarding
  if (!householdId) {
    return <OnboardingScreen />;
  }

  const screens: Record<Screen, React.ReactNode> = {
    dashboard: (
      <DashboardScreen
        onNavigate={setScreen}
        onEditSchedule={(id) => {
          setActiveScheduleId(id);
          setScreen("active-focus");
        }}
        onActiveFocus={(id) => {
          setActiveScheduleId(id);
          setScreen("active-focus");
        }}
      />
    ),
    "create-schedule": (
      <CreateScheduleScreen
        editingId={editingScheduleId}
        onBack={() => {
          setEditingScheduleId(null);
          setScreen("dashboard");
        }}
      />
    ),
    "active-focus": (
      <ActiveFocusScreen
        scheduleId={activeScheduleId}
        onBack={() => setScreen("dashboard")}
      />
    ),
    devices: <DeviceOverviewScreen onBack={() => setScreen("dashboard")} />,
    weekly: <WeeklyRoutineScreen onBack={() => setScreen("dashboard")} />,
    settings: <SettingsScreen />,
    "child-device": <ChildDeviceScreen />,
  };

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {screens[currentScreen]}
        </motion.div>
      </AnimatePresence>
      <BottomNav currentScreen={currentScreen} onNavigate={setScreen} />
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
