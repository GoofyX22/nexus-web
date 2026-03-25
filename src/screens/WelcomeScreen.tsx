"use client";

import { motion } from "framer-motion";
import { useApp } from "@/context/AppContext";

export default function WelcomeScreen() {
  const { setScreen } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-primary-foreground px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        <span className="text-5xl font-heading font-bold text-primary">N</span>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-heading font-bold text-foreground"
      >
        Nexus
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-muted-foreground text-center max-w-xs mt-3"
      >
        Reclaim Your Focus.{"\n"}Rebuild Your Rhythm.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col gap-3 max-w-xs w-full mt-10"
      >
        <button
          onClick={() => setScreen("family-setup")}
          className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Get Started
        </button>
        <button
          onClick={() => setScreen("dashboard")}
          className="w-full py-4 rounded-lg bg-secondary text-secondary-foreground font-semibold text-lg hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Learn More
        </button>
      </motion.div>
    </div>
  );
}
