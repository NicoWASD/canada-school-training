import { useState } from 'react'

export default function Login(props: any) {
  const [email, setEmail] = useState('secretaria@canadaschool.edu.ar')
  const [pass, setPass] = useState('1234')
  const [rol, setRol] = useState('admin')

  function entrar() {
    props.onLogin({ email: email, rol: rol })
  }

  return (
    <div style={{ maxWidth: 340, margin: '80px auto', background: '#fff', padding: 30 }}>
      <div style={{ textAlign: 'center', fontSize: 22, color: '#c0142c', fontWeight: 'bold' }}>Canada School</div>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#999', marginBottom: 20 }}>PEDRO GOYENA - CABALLITO</div>
      <div>Email</div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
      <div>Contraseña</div>
      <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: '100%', marginBottom: 10 }} />
      <div>Rol</div>
      <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ width: '100%', marginBottom: 15 }}>
        <option value="admin">admin</option>
        <option value="secretaria">secretaria</option>
        <option value="tutor">tutor</option>
      </select>
      <button className="btn" style={{ width: '100%' }} onClick={entrar}>Ingresar</button>
    </div>
  )
}
