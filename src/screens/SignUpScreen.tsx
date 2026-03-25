"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function SignUpScreen({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background px-6">
        <div className="w-20 h-20 rounded-full bg-active-green/20 flex items-center justify-center mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-heading font-bold">Check your email</h1>
        <p className="text-muted-foreground text-center mt-2 max-w-xs">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <button
          onClick={onSwitch}
          className="mt-6 py-3 px-8 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col justify-center bg-background px-6"
    >
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-heading font-bold text-primary">N</span>
        </div>
        <h1 className="text-2xl font-heading font-bold">Create your account</h1>
        <p className="text-muted-foreground mt-1">Start managing your family&apos;s devices</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your full name"
          required
          className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-muted-foreground mt-6">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-primary font-semibold">
          Sign in
        </button>
      </p>
    </motion.div>
  );
}
