"use client";

import { motion } from "framer-motion";
import { User, Bell, Shield, HelpCircle, LogOut, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const menuItems = [
  { icon: User, label: "Family Profile", desc: "Manage family members" },
  { icon: Bell, label: "Notifications", desc: "Alert preferences" },
  { icon: Shield, label: "Privacy", desc: "Data & security settings" },
  { icon: HelpCircle, label: "Help & Support", desc: "FAQ and contact us" },
];

export default function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const { householdName, inviteCode } = useData();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const childLink = typeof window !== "undefined"
    ? `${window.location.origin}/child`
    : "";

  const copyInvite = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyChildLink = () => {
    navigator.clipboard.writeText(childLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <h1 className="text-2xl font-heading font-bold mb-2">Settings</h1>

      {/* Account Info */}
      <div className="p-4 rounded-xl bg-card border border-input mb-4">
        <p className="font-semibold">{profile?.full_name}</p>
        <p className="text-sm text-muted-foreground">{profile?.email}</p>
        <p className="text-sm text-muted-foreground mt-1">{householdName}</p>
      </div>

      {/* Child Device Link */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Share2 size={16} className="text-primary" />
          <p className="font-semibold text-sm">Child Device Link</p>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Send this link to your child&apos;s device. They&apos;ll enter the pairing code to connect.
        </p>
        <button
          onClick={copyChildLink}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
        >
          {copiedLink ? <Check size={14} /> : <Copy size={14} />}
          {copiedLink ? "Copied!" : "Copy Child Link"}
        </button>
      </div>

      {/* Invite Code */}
      {inviteCode && (
        <div className="p-4 rounded-xl bg-card border border-input mb-6">
          <p className="text-sm text-muted-foreground mb-1">Household Invite Code</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg tracking-wider">{inviteCode}</span>
            <button onClick={copyInvite} className="text-muted-foreground hover:text-primary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}

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
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-destructive/10 text-destructive font-semibold mt-8 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <LogOut size={18} />
        Sign Out
      </motion.button>
    </div>
  );
}
