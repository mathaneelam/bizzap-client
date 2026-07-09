import { useState } from 'react'
import './theme.css'
import LeadsTab from './tabs/LeadsTab'
import DemosTab from './tabs/DemosTab'
import DealsTab from './tabs/DealsTab'
import StaffTab from './tabs/StaffTab'
import ActivityTab from './tabs/ActivityTab'
import LoginPage from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { useActivityLogger } from './hooks/useActivityLogger'
import type { StaffAccess } from './types'

type Tab = 'leads' | 'demos' | 'deals' | 'staff' | 'activity' | 'settings'

function UserMenu({ staff, onSettings, settingsActive, onSignOut }: {
  staff: StaffAccess
  onSettings: () => void
  settingsActive: boolean
  onSignOut: () => void
}) {
  return (
    <div className="user-menu">
      {staff.avatar_url
        ? <img className="staff-avatar" src={staff.avatar_url} alt={staff.name || staff.email} referrerPolicy="no-referrer" />
        : <div className="staff-avatar staff-avatar-fallback">{(staff.name || staff.email).charAt(0).toUpperCase()}</div>}
      <div className="user-menu-info">
        <div className="user-menu-name">{staff.name || staff.email}</div>
        <div className="user-menu-role">{staff.role}</div>
      </div>
      <button
        className={`btn btn-sm ${settingsActive ? 'btn-primary' : 'btn-ghost'}`}
        onClick={onSettings}
        title="Settings"
      >
        ⚙️ Settings
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onSignOut}>Sign Out</button>
    </div>
  )
}

function AccessGate({ staff, session, onSignOut }: {
  staff: StaffAccess | null
  session: { user: { email?: string } }
  onSignOut: () => void
}) {
  const status = staff?.status ?? 'pending'
  const email = staff?.email ?? session.user.email ?? ''

  const screens = {
    pending: { icon: '⏳', title: 'Access Pending', msg: 'Your access request is being reviewed. An admin will approve your account shortly.' },
    rejected: { icon: '🚫', title: 'Access Denied', msg: 'Your access request was not approved. Please contact an administrator if you believe this is a mistake.' },
  }
  const screen = status === 'rejected' ? screens.rejected : screens.pending

  return (
    <div className="login-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="login-card">
        <div className="gate-icon">{screen.icon}</div>
        <h1 className="login-title">{screen.title}</h1>
        <p className="login-subtitle">{screen.msg}</p>
        <div className="gate-email">{email}</div>
        <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={onSignOut}>Sign Out</button>
      </div>
    </div>
  )
}

export default function App() {
  const { loading, session, staff, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('leads')
  const [toast, setToast] = useState<string | null>(null)

  const logger = useActivityLogger(staff?.email ?? '', staff?.name ?? null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const missingEnv = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

  // ── Auth gating ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="login-shell">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="spinner" />
      </div>
    )
  }

  if (!session) return <LoginPage />

  if (!staff || staff.status !== 'approved') {
    return <AccessGate staff={staff} session={session} onSignOut={signOut} />
  }

  const isAdmin = staff.role === 'admin'
  const tabs: { id: Tab; label: string }[] = [
    { id: 'leads', label: '📋 Leads Manager' },
    { id: 'demos', label: '🖥️ Demos & Screenshots' },
    { id: 'deals', label: '💳 Deals & Invoices' },
    { id: 'activity', label: '📋 Activity' },
    ...(isAdmin ? [{ id: 'staff' as Tab, label: '👥 Staff' }] : []),
  ]

  return (
    <div className="dashboard-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <header className="navbar">
        <div className="navbar-logo">Bizzap</div>
        <UserMenu
          staff={staff}
          onSettings={() => setTab('settings')}
          settingsActive={tab === 'settings'}
          onSignOut={signOut}
        />
      </header>

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

      <div className="tabs-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="tab-content">
        {tab === 'leads' && <LeadsTab onToast={showToast} logActivity={logger.logActivity} />}
        {tab === 'demos' && <DemosTab onToast={showToast} logActivity={logger.logActivity} />}
        {tab === 'deals' && <DealsTab onToast={showToast} logActivity={logger.logActivity} />}
        {tab === 'activity' && <ActivityTab currentUser={staff} onToast={showToast} />}
        {tab === 'staff' && isAdmin && <StaffTab currentUser={staff} onToast={showToast} logActivity={logger.logActivity} />}
        {tab === 'settings' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('leads')}>← Back</button>
              <h2 style={{ margin: 0, fontSize: 20 }}>⚙️ Settings</h2>
            </div>
            <DealsTab variant="archive" onToast={showToast} logActivity={logger.logActivity} />
          </div>
        )}
      </main>

      {toast && (
        <div className="toast">
          <div className="toast-dot" />
          {toast}
        </div>
      )}
    </div>
  )
}
