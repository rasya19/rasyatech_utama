export default function MasterAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleResetPassword = () => {
    // logic reset password lo taro sini
    console.log('Reset password untuk:', email)
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password" 
      />

      <button className="Login">Login</button>

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
    </div>
  )
}
