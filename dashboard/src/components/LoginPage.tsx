import { supabase } from '../supabase'
import '../theme.css'

export default function LoginPage() {
  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  return (
    <div className="login-shell">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <span className="login-logo-icon">⚡</span>
          <span className="login-logo-text">Bizzap</span>
        </div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">
          Sign in to access the Bizzap Admin Dashboard
        </p>

        <button className="login-google-btn" onClick={handleGoogleSignIn}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.7 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
            <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.3-17.7 11.7z" fill="#FF3D00"/>
            <path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.6 35.8 27 37 24 37c-6 0-10.6-3-11.8-7.5L5.3 35c3.5 7 10 12 18.7 12z" fill="#4CAF50"/>
            <path d="M44.5 20H24v8.5h11.8c-.9 2.9-2.8 5.3-5.4 7l6.6 5.6C41 38.1 45 32 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
          </svg>
          Sign in with Google
        </button>

        <p className="login-footer">
          Access is restricted to approved Bizzap team members.
        </p>
      </div>
    </div>
  )
}
