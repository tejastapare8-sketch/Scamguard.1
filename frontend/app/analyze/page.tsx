"use client";

import { useState } from "react";
import { analyzeMessage } from "@/services/analysisService";
import { AnalysisResult } from "@/lib/api";
import { ResultPanel } from "@/components/ResultPanel";

const SAMPLES = [
  {
    name: "Bank phishing",
    sender: "VM-SBIUPI",
    text: "Your bank account will be blocked today. Verify immediately: http://bank-secure-login.xyz/kyc",
  },
  {
    name: "OTP authority",
    sender: "+919999888777",
    text: "I am from the bank. Tell me your OTP now or your account will be permanently blocked.",
  },
  {
    name: "Payment emergency",
    sender: "+918888777666",
    text: "Send ₹25,000 immediately to this new account. Don't call me, I'm in an emergency. UPI: helpnow@oksbi",
  },
  {
    name: "Safe debit",
    sender: "VK-HDFCBK",
    text: "INR 1,240 debited from HDFC account XX7812 at grocery. Avl bal INR 24,110. Do not share OTP.",
  },
];

export default function AnalyzePage() {
  const [channel, setChannel] = useState("sms");
  const [sender, setSender] = useState(SAMPLES[0].sender);
  const [text, setText] = useState(SAMPLES[0].text);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setErr(null);
    try {
      const r = await analyzeMessage({ channel, sender, text });
      setResult(r);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Scan a message</h1>
        <p className="mt-1 text-sm text-slate-500">Paste SMS, email or WhatsApp text. Get an explainable risk score.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                setText(s.text);
                setSender(s.sender);
              }}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-navy hover:bg-slate-50"
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="chat">Chat</option>
            <option value="payment">Payment request</option>
          </select>
          <input
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Sender"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed"
          />
          <button
            type="button"
            onClick={run}
            disabled={busy}
            className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "Analyzing…" : "Analyze message"}
          </button>
          {err && <p className="text-sm text-danger">{err}</p>}
        </div>
      </div>

      <div>{result && <ResultPanel result={result} preview={text} />}</div>
    </div>
  );
}
