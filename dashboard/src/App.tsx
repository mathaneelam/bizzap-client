import { useState, useEffect } from 'react'
import './theme.css'
import LeadsTab from './tabs/LeadsTab'
import DemosTab from './tabs/DemosTab'
import DealsTab from './tabs/DealsTab'

type Tab = 'leads' | 'demos' | 'deals'

export default function App() {
  const [tab, setTab] = useState<Tab>('leads')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // Check for Supabase env vars
  const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="dashboard-shell">
      {/* Background orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-logo">Bizzap</div>
        <div className="navbar-meta">Admin Dashboard · Tiruppur</div>
      </header>

      {/* Missing env warning */}
      {missingEnv && (
        <div style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10,
          margin: '16px 40px 0',
          padding: '12px 20px',
          fontSize: 13,
          color: 'var(--amber)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          ⚠️ <strong>Supabase not connected.</strong>&nbsp;
          Copy <code>dashboard/.env.example</code> → <code>dashboard/.env</code> and add your project credentials, then restart.
        </div>
      )}

      {/* Tabs bar */}
      <div className="tabs-bar">
        {([
          { id: 'leads', label: '📋 Leads Manager' },
          { id: 'demos', label: '🖥️ Demos & Screenshots' },
          { id: 'deals', label: '💳 Deals & Invoices' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <main className="tab-content">
        {tab === 'leads' && <LeadsTab onToast={showToast} />}
        {tab === 'demos' && <DemosTab onToast={showToast} />}
        {tab === 'deals' && <DealsTab onToast={showToast} />}
      </main>

      {/* Toast */}
      {toast && (
        <div className="toast">
          <div className="toast-dot" />
          {toast}
        </div>
      )}
    </div>
  )
}
