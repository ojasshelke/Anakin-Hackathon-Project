'use client';
import React, { useState } from 'react';
import CalendarPicker from './CalendarPicker';

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+'];
const PLATFORMS = ['Shopify', 'WooCommerce', 'Custom React', 'Native Mobile', 'Other'];

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  companySize: string;
  platform: string;
  message: string;
}

const INITIAL: FormState = { name: '', email: '', phone: '', company: '', companySize: '', platform: '', message: '' };

type Step = 'form' | 'calendar' | 'confirmed';

export default function BookingFormSection() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmedSlot, setConfirmedSlot] = useState<{ date: string; time: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('calendar');
  };

  const handleSlotSelect = async (date: string, time: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, slotDate: date, slotTime: time }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Slot unavailable.'); setLoading(false); return; }
      setConfirmedSlot({ date, time });
      setStep('confirmed');
    } catch { setError('Network error. Please try again.'); }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <section id="booking-section" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(ellipse, #4A6741 0%, #8B7D3C 100%)' }} />
      </div>
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14 animate-on-scroll">
          <span className="text-xs font-mono tracking-widest uppercase text-accent mb-4 block">Get Started</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Book a <span className="text-gradient-primary">live demo.</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            See VEXA running inside your stack in under 30 minutes. No sales pitch — just a working integration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-on-scroll">
          {/* Left: Stats */}
          <div className="lg:col-span-2 flex flex-col gap-6 justify-center">
            {[
              { value: '30 min', label: 'Average demo length', color: '#4A6741' },
              { value: '3 days', label: 'To full integration', color: '#8B7D3C' },
              { value: '40%+', label: 'Avg. conversion lift', color: '#6B8C5E' },
              { value: '200+', label: 'Brands already live', color: '#A69060' },
            ].map((stat, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:border-primary/30 transition-all duration-300">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: stat.color }} />
                <div>
                  <div className="text-2xl font-extrabold tracking-tight" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Form / Calendar / Confirmation */}
          <div className="lg:col-span-3">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
            )}

            {step === 'confirmed' ? (
              <div className="glass-card rounded-3xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px] gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#4A674120' }}>
                  <svg className="w-8 h-8" fill="none" stroke="#4A6741" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">You&apos;re booked!</h3>
                  {confirmedSlot && (
                    <div className="glass-card rounded-xl p-4 mb-3 inline-block">
                      <div className="text-sm font-semibold text-primary">{formatDate(confirmedSlot.date)}</div>
                      <div className="text-lg font-bold text-foreground">{confirmedSlot.time}</div>
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    We&apos;ve sent a confirmation to <strong className="text-foreground">{form.email}</strong>. Our team will reach out with meeting details.
                  </p>
                </div>
                <button onClick={() => { setStep('form'); setForm(INITIAL); setConfirmedSlot(null); setBookingId(null); setError(null); }} className="text-xs font-mono text-accent underline underline-offset-4 hover:text-foreground transition-colors">
                  Submit another request
                </button>
              </div>
            ) : step === 'calendar' ? (
              <div className="glass-card rounded-3xl p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <h3 className="text-lg font-bold text-foreground">Pick your slot</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose a date and time for your personalized demo.</p>
                </div>
                <CalendarPicker onSelect={handleSlotSelect} loading={loading} />
                <button onClick={() => { setStep('form'); setError(null); }} className="mt-4 text-xs font-mono text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
                  ← Back to form
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Full Name <span className="text-accent">*</span></label>
                    <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Alex Johnson" className="bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Work Email <span className="text-accent">*</span></label>
                    <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="alex@brand.com" className="bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Company <span className="text-accent">*</span></label>
                    <input type="text" name="company" required value={form.company} onChange={handleChange} placeholder="Your Brand Inc." className="bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Company Size</label>
                    <select name="companySize" value={form.companySize} onChange={handleChange} className="bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer">
                      <option value="" className="bg-card">Select size</option>
                      {COMPANY_SIZES.map((s) => (<option key={s} value={s} className="bg-card">{s} employees</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Current Platform</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button key={p} type="button" onClick={() => setForm((prev) => ({ ...prev, platform: p }))}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-200 focus:outline-none"
                        style={{ borderColor: form.platform === p ? '#4A6741' : 'rgba(209,203,189,0.5)', background: form.platform === p ? '#4A674112' : 'transparent', color: form.platform === p ? '#4A6741' : 'var(--muted-foreground)' }}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Anything specific you want to see?</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={3} placeholder="e.g. We want to see how it handles plus-size body types..." className="bg-secondary/30 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 bg-primary text-white hover:bg-primary/90" style={{ boxShadow: '0 4px 16px rgba(74,103,65,0.2)' }}>
                  {loading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Submitting...</>
                  ) : (
                    <>Continue to Pick a Slot<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg></>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground/60">No commitment. No credit card. Just a 30-min call.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
