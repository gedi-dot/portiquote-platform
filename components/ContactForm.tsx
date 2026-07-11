"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    setState("sending");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    setState(res.ok ? "sent" : "error");
  }

  if (state === "sent") {
    return (
      <div className="bg-paper border border-tide/40 ring-1 ring-tide/20 rounded-xl p-6 text-center">
        <p className="font-display font-semibold text-lg">Message sent</p>
        <p className="text-sm text-ink/60 mt-1">Asante — we&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <div className="bg-paper border border-ink/10 rounded-xl p-6 space-y-4">
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/45">Message</span>
        <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-tide" />
      </label>
      {state === "error" && <p className="text-sm text-coral">Could not send — please try again.</p>}
      <button onClick={submit}
        disabled={state === "sending" || !name.trim() || !email.includes("@") || !message.trim()}
        className="w-full bg-sea text-paper font-semibold text-sm rounded-lg py-3 disabled:opacity-50 hover:bg-ink transition">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </div>
  );
}
