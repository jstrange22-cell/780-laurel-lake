import * as React from "react";
import { useId, useState } from "react";

interface Props {
  webhookUrl: string;
  propertyAddress: string;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm({ webhookUrl, propertyAddress }: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  // Render time as a simple bot deterrent — humans take >2s to fill the form
  const [renderedAt] = useState(() => Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;

    const fd = new FormData(e.currentTarget);
    const honeypot = String(fd.get("company") ?? "");
    if (honeypot) return; // bot

    const elapsed = Date.now() - renderedAt;
    if (elapsed < 1500) {
      setStatus("error");
      setErrorMessage("Please take a moment with the form before submitting.");
      return;
    }

    const payload = {
      property: propertyAddress,
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      preferredDate: String(fd.get("date") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
      submittedAt: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.href : "",
    };

    if (!payload.name || !payload.email) {
      setStatus("error");
      setErrorMessage("Name and email are required.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");
    try {
      if (webhookUrl) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
      } else {
        // Dev mode — log the payload
        console.info("[ContactForm] would send:", payload);
        await new Promise((r) => setTimeout(r, 600));
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Network error");
    }
  }

  if (status === "sent") {
    return (
      <div className="surface flex flex-col items-start gap-3 rounded-2xl p-8">
        <p className="text-eyebrow text-gold-300">Message received</p>
        <p className="text-display text-2xl text-ink-50">
          Thanks — we'll be in touch shortly.
        </p>
        <p className="text-ink-300 text-sm">
          Your inquiry has been logged for {propertyAddress}.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface grid grid-cols-1 gap-4 rounded-2xl p-6 sm:p-8 md:grid-cols-2"
      noValidate
    >
      {/* Honeypot — hidden from users, visible to dumb bots */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", height: 0, overflow: "hidden" }}
      >
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Field id={`${id}-name`} label="Name" name="name" type="text" required autoComplete="name" />
      <Field
        id={`${id}-email`}
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
      />
      <Field id={`${id}-phone`} label="Phone" name="phone" type="tel" autoComplete="tel" />
      <Field id={`${id}-date`} label="Preferred Tour Date" name="date" type="date" />

      <div className="md:col-span-2">
        <label htmlFor={`${id}-message`} className="text-eyebrow mb-2 block text-ink-300">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          className="w-full resize-y rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-gold-300 focus:outline-none"
          placeholder={`I'd like to schedule a tour of ${propertyAddress}…`}
        />
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="text-stat text-ink-500">
          We'll never share your information.
        </p>
        <button
          type="submit"
          disabled={status === "sending"}
          className="btn btn-gold disabled:cursor-not-allowed disabled:opacity-60"
          data-magnetic
        >
          {status === "sending" ? "Sending…" : "Request Tour"}
          {status !== "sending" && (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M3 7h8M8 4l3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          )}
        </button>
      </div>

      {status === "error" && (
        <p className="md:col-span-2 text-sm text-red-400" role="alert">
          {errorMessage || "Something went wrong. Please try again."}
        </p>
      )}
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}

function Field({ id, label, name, type = "text", required, autoComplete }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-eyebrow mb-2 block text-ink-300">
        {label}
        {required && <span className="ml-1 text-gold-300">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-white/10 bg-ink-900/40 px-4 py-3 text-ink-100 placeholder:text-ink-500 focus:border-gold-300 focus:outline-none"
      />
    </div>
  );
}
