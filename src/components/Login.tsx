import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Login gagal: ' + error.message)
    } else {
      navigate('/master-admin')
    }
    setLoading(false)
  }

  const handleResetPassword = async () => {
    if (!email) {
      alert('Isi email dulu bro')
      return
    }
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://rasyatech.rsch.my.id/reset-password', // INI YANG BENERIN LINK
    })
    
    if (error) {
      alert('Gagal kirim email: ' + error.message)
    } else {
      alert('Link reset password udah dikirim ke email. Cek inbox/spam.')
    }
  }

  const navigate = useNavigate()

  return (
    <div style={{maxWidth: 400, margin: '100px auto', padding: 20}}>
      <h2>Login Super Admin</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{width: '100%', padding: 10, marginBottom: 10}}
        />
        <input 
          type="password" 
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{width: '100%', padding: 10, marginBottom: 10}}
        />
        <button type="submit" disabled={loading} style={{width: '100%', padding: 10, marginBottom: 10}}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      <button onClick={handleResetPassword} style={{width: '100%', padding: 10}}>
        Lupa Password?
      </button>
    </div>
  )
}
