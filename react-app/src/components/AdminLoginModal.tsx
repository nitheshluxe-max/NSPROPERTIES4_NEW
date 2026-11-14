import React, { useState } from 'react';
import { useProperty } from '../context/PropertyContext';
import { supabase } from '../lib/supabase';

export const AdminLoginModal: React.FC = () => {
  const { isAdminLoginModalOpen, setIsAdminLoginModalOpen } = useProperty();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (!isAdminLoginModalOpen) return null;

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (error) throw error;
      if (!data.user) throw new Error('Unable to verify your account.');
      const { data: membership, error: membershipError } = await supabase
        .from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
      if (membershipError || !membership) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized as an administrator.');
      }
      setPassword('');
      setIsAdminLoginModalOpen(false);
      window.location.hash = '#admin';
      // The PropertyProvider auth listener confirms admin membership before rendering.
      // Reload to ensure an existing #admin route is recognized after sign-in.
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="fixed inset-0 z-[100] bg-slate-950/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Admin sign in">
    <form onSubmit={signIn} className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Admin sign in</h2>
        <button type="button" aria-label="Close" onClick={() => setIsAdminLoginModalOpen(false)}>✕</button>
      </div>
      <p className="text-sm text-slate-600">Use your authorized Supabase admin email and password.</p>
      <label className="block text-sm font-medium text-slate-700" htmlFor="admin-email">Email address</label>
      <input id="admin-email" type="email" required autoComplete="username" placeholder="Admin email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900" />
      <label className="block text-sm font-medium text-slate-700" htmlFor="admin-password">Password</label>
      <input id="admin-password" type="password" required autoComplete="current-password" placeholder="Admin password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-900" />
      <button type="submit" disabled={busy} className="w-full bg-blue-700 text-white rounded-lg p-3 disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in to admin console'}</button>
      {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
      <button type="button" className="text-sm text-blue-700 underline" onClick={() => { setIsAdminLoginModalOpen(false); window.location.hash = "#forgot-password"; }}>Forgot password? Set or reset your password</button>
    </form>
  </div>;
};
