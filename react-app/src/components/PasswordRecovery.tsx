import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const recoveryRedirect = () => {
  const url = new URL(window.location.href);
  url.search = '?auth=recovery';
  url.hash = '';
  return url.toString();
};

export function PasswordRecovery({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoverySession, setRecoverySession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const isCallback = new URLSearchParams(window.location.search).get('auth') === 'recovery';

  useEffect(() => {
    if (!isCallback) return;
    let mounted = true;
    // Supabase emits PASSWORD_RECOVERY after processing the recovery callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && mounted) setRecoverySession(true);
    });
    // A refresh after a successful recovery callback still has an authenticated session.
    // This page is only entered via the explicit recovery query parameter.
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) setRecoverySession(true);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [isCallback]);

  async function sendRecovery(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: recoveryRedirect()
      });
      if (authError) throw authError;
      setMessage('If this email has an account, a password reset link will be sent. Check your inbox and spam folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request password recovery.');
    } finally { setBusy(false); }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(''); setMessage('');
    if (password.length < 12) { setError('Use a password with at least 12 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('This recovery link has expired. Request another password reset email.');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setPassword(''); setConfirm('');
      await supabase.auth.signOut();
      setRecoverySession(false);
      window.history.replaceState({}, '', window.location.pathname + '#admin');
      setMessage('Password saved successfully. Return to Admin Console and sign in with your new password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <section className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">{isCallback ? 'Set new password' : 'Forgot admin password?'}</h1>
      <p className="text-sm text-slate-600">{isCallback ? 'Use the recovery link sent to your email to create a new password.' : 'Enter your Supabase admin account email to receive a password reset link.'}</p>
      {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</p>}
      {message && <p role="status" className="p-3 rounded-lg bg-green-50 text-green-800 text-sm">{message}</p>}
      {isCallback ? recoverySession ? (
        <form onSubmit={savePassword} className="space-y-4">
          <label className="block text-sm font-medium text-slate-800">New password
            <input required type="password" autoComplete="new-password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} className="block w-full mt-1 p-3 rounded-lg border border-slate-300" />
          </label>
          <label className="block text-sm font-medium text-slate-800">Confirm new password
            <input required type="password" autoComplete="new-password" minLength={12} value={confirm} onChange={e => setConfirm(e.target.value)} className="block w-full mt-1 p-3 rounded-lg border border-slate-300" />
          </label>
          <button disabled={busy} className="w-full bg-blue-700 text-white rounded-lg p-3 disabled:opacity-50">{busy ? 'Saving…' : 'Save new password'}</button>
        </form>
      ) : <p className="text-sm text-amber-800">Waiting for a valid recovery session. If the link has expired, request a new reset email.</p> : (
        <form onSubmit={sendRecovery} className="space-y-4">
          <label className="block text-sm font-medium text-slate-800">Admin email
            <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full mt-1 p-3 rounded-lg border border-slate-300" />
          </label>
          <button disabled={busy} className="w-full bg-blue-700 text-white rounded-lg p-3 disabled:opacity-50">{busy ? 'Sending…' : 'Send password reset email'}</button>
        </form>
      )}
      <button type="button" className="text-sm text-blue-700 underline" onClick={onClose}>Return to Admin Console</button>
    </section>
  </main>;
}
