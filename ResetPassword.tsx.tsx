import { useState } from 'react'
import { supabase } from '../../supabaseClient' // sesuaikan path supabaseClient kamu
import { useNavigate } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.updateUser({ 
      password: password 
    })
    
    if (error) {
      alert('Gagal update: ' + error.message)
    } else {
      alert('Password berhasil diubah! Silakan login ulang.')
      await supabase.auth.signOut()
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div style={{maxWidth: 400, margin: '100px auto', padding: 20}}>
      <h2>Reset Password Super Admin</h2>
      <form onSubmit={handleReset}>
        <input 
          type="password" 
          placeholder="Password baru min 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{width: '100%', padding: 10, marginBottom: 10}}
        />
        <button type="submit" disabled={loading} style={{width: '100%', padding: 10}}>
          {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  )
}