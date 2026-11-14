import React from 'react';

const sections = [
  { title: 'Property Listings', description: 'Review, edit and publish properties', icon: '🏢' },
  { title: 'Marketplace Approvals', description: 'Approve or reject submitted listings', icon: '✓' },
  { title: 'Customer Inquiries', description: 'Manage leads and contact requests', icon: '✉' },
  { title: 'Analytics', description: 'Track traffic and listing performance', icon: '▥' },
  { title: 'Settings', description: 'Manage accounts and portal configuration', icon: '⚙' }
];

export const AdminPreview: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => (
  <main className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-slate-950 text-white px-4 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs uppercase tracking-widest text-blue-300">NS PROPERTIES 4</p>
        <h1 className="text-2xl font-bold">Admin Console</h1></div>
      <a href="#home" className="text-sm underline text-slate-200">Back to website</a>
    </header>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h2 className="text-lg font-bold text-blue-950">Read-only dashboard preview</h2>
        <p className="text-sm text-blue-900 mt-1">This public preview contains no real customer information, property records, or live statistics. Sign in as an authorized administrator to manage the portal.</p>
        <button onClick={onSignIn} className="mt-4 bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold">Admin sign in</button>
      </section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['Total Properties','Pending Approvals','Customer Inquiries','Site Visitors'].map(label => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-sm text-slate-600">{label}</div>
            <div className="text-2xl font-bold text-slate-500 mt-2">—</div>
            <div className="text-xs text-slate-500">Sign in to view</div>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-bold">Management sections</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(section => (
          <div key={section.title} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-2xl" aria-hidden="true">{section.icon}</div>
            <h3 className="font-bold mt-3">{section.title}</h3>
            <p className="text-sm text-slate-600 mt-1">{section.description}</p>
            <p className="text-xs text-blue-700 font-medium mt-4">Sign in to access</p>
          </div>
        ))}
      </div>
    </div>
  </main>
);
