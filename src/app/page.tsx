"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AppProvider, useApp } from "@/context/AppContext";
import BottomNav from "@/components/BottomNav";
import WelcomeScreen from "@/screens/WelcomeScreen";
import FamilySetupScreen from "@/screens/FamilySetupScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import CreateScheduleScreen from "@/screens/CreateScheduleScreen";
import ActiveFocusScreen from "@/screens/ActiveFocusScreen";
import DeviceOverviewScreen from "@/screens/DeviceOverviewScreen";
import WeeklyRoutineScreen from "@/screens/WeeklyRoutineScreen";
import SettingsScreen from "@/screens/SettingsScreen";

const screens: Record<string, React.ComponentType> = {
  welcome: WelcomeScreen,
  "family-setup": FamilySetupScreen,
  dashboard: DashboardScreen,
  "create-schedule": CreateScheduleScreen,
  "active-focus": ActiveFocusScreen,
  devices: DeviceOverviewScreen,
  weekly: WeeklyRoutineScreen,
  settings: SettingsScreen,
};

function AppShell() {
  const { currentScreen } = useApp();
  const Screen = screens[currentScreen] || WelcomeScreen;

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
          <Screen />
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
