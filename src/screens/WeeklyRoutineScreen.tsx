"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useApp } from "@/context/AppContext";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7am to 9pm

const scheduleColors: Record<string, string> = {
  "Homework Focus Mode": "bg-primary/20 border-primary/30",
  "Bedtime Shutdown": "bg-muted border-muted-foreground/20",
  "Family Dinner Pause": "bg-active-green/20 border-active-green/30",
  "Device-Free Time": "bg-primary/10 border-primary/20",
};

function timeToHour(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h + m / 60;
}

export default function WeeklyRoutineScreen() {
  const { setScreen, schedules } = useApp();

  return (
    <div className="min-h-screen bg-background px-6 pt-12 pb-24">
      <button
        onClick={() => setScreen("dashboard")}
        className="flex items-center gap-1 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-2xl font-heading font-bold">Weekly Schedule</h1>
      <p className="text-muted-foreground mt-1 mb-6">Your family&apos;s weekly routine overview</p>

      {/* Calendar Grid */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-8 gap-1">
            {/* Header */}
            <div className="text-xs text-muted-foreground font-medium p-2" />
            {days.map((day) => (
              <div key={day} className="text-xs text-center font-semibold p-2 text-foreground">
                {day}
              </div>
            ))}

            {/* Rows */}
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="text-xs text-muted-foreground p-1 text-right pr-2">
                  {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                </div>
                {days.map((day) => {
                  const block = schedules.find((s) => {
                    const start = timeToHour(s.timeStart);
                    const end = timeToHour(s.timeEnd);
                    const inDay = !s.days || s.days.includes(day);
                    return inDay && hour >= start && hour < end;
                  });
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={`h-8 rounded border ${
                        block
                          ? scheduleColors[block.name] || "bg-primary/10 border-primary/20"
                          : "bg-card border-border"
                      }`}
                    >
                      {block && hour === Math.floor(timeToHour(block.timeStart)) && (
                        <span className="text-[9px] font-semibold truncate px-1 leading-8">
                          {block.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-3 mt-6"
      >
        {schedules.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${scheduleColors[s.name]?.split(" ")[0] || "bg-primary/10"}`} />
            <span className="text-xs text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
