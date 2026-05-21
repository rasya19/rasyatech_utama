import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { Settings, Loader2, ArrowLeft, AlertCircle } from 'lucide-react'

export default function MasterAdmin() {
  const [email, setEmail] = useState('') //
  const [password, setPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false);


  const handleResetPassword = async () => {
  if (!email) {
    setSaveStatus({ type: 'error', message: 'Silakan masukkan email Anda terlebih dahulu di kolom atas' })
    return;
  }
  
  setResetLoading(true);
  setSaveStatus(null);
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://rasyatech.rsch.my.id/reset-password',
  })
  
  setResetLoading(false);
  
  if (error) {
    setSaveStatus({ type: 'error', message: 'Gagal kirim: ' + error.message })
  } else {
    setSaveStatus({ type: 'success', message: 'Link reset password udah dikirim ke email. Cek inbox/spam.' })
  }
}

const handleSendMagicLink = async () => {
  // ...
}

  setResetLoading(true);
  setSaveStatus(null);
  
  setResetLoading(false);
  
  if (error) {
    setSaveStatus({ type: 'error', message: 'Gagal kirim: ' + error.message })
  } else {
    setSaveStatus({ type: 'success', message: 'Link reset password udah dikirim ke email. Cek inbox/spam.' })
  }
}

  // ... di bagian return JSX form login
  return (
    <div>
      {/* ... form kamu yang udah ada */}
      
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input type="password" placeholder="Password" />
      
      <button className="Login">Login</button>
      
      {/* TAMBAHIN INI DI BAWAH TOMBOL LOGIN */}
      <button 
        type="button"
        onClick={handleResetPassword}
        style={{
          background: 'none',
          border: 'none',
          color: '#6366f1',
          marginTop: '12px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Lupa Password?
      </button>
    )
}
   
