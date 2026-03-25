"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";

const menuItems = [
  { icon: User, label: "Family Profile", desc: "Manage family members", color: "bg-primary/10 text-primary" },
  { icon: Bell, label: "Notifications", desc: "Alert preferences", color: "bg-primary/10 text-primary" },
  { icon: Shield, label: "Privacy", desc: "Data & security settings", color: "bg-primary/10 text-primary" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQ and contact us", color: "bg-primary/10 text-primary" },
];

export default function SettingsScreen() {
  const { setScreen } = useApp();

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-6">Settings</h1>

      <div className="space-y-2">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-card border border-input text-left hover:shadow-sm transition-shadow active:scale-[0.98]"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setScreen("welcome")}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-destructive/10 text-destructive font-semibold mt-8 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <LogOut size={18} />
        Sign Out
      </motion.button>
    </div>
  );
}
