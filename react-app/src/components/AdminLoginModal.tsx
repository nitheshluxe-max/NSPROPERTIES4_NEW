import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { requestEmailLogin } from '../lib/propertyRepository';

export const AdminLoginModal: React.FC = () => {
  const { isAdminLoginModalOpen, setIsAdminLoginModalOpen } = useProperty();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isAdminLoginModalOpen) return null;

  const sendLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await requestEmailLogin(email.trim(), window.location.origin + window.location.pathname + '#admin');
      setMessage('Check your email for the sign-in link. Only registered admins can access the dashboard.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send login link.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Admin sign in">
    <form onSubmit={sendLink} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Admin sign in</h2>
        <button type="button" aria-label="Close" onClick={() => setIsAdminLoginModalOpen(false)}>✕</button>
      </div>
      <p className="text-sm text-slate-600">Sign in using your authorized Supabase admin email.</p>
      <input type="email" required autoComplete="email" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3" />
      <button type="submit" disabled={busy} className="w-full bg-blue-700 text-white rounded-lg p-3 disabled:opacity-50">{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
      {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
    </form>
  </div>;
};
