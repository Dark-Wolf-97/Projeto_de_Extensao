import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div style={{
      width: '200px',
      height: '100vh',
      background: '#2c3e50',
      color: '#fff',
      position: 'fixed',
      padding: '20px'
    }}>
      <h2>Clínica</h2>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link to="/" style={{ color: '#fff' }}>Dashboard</Link>
        <Link to="/pacientes" style={{ color: '#fff' }}>Pacientes</Link>
        <Link to="/agenda" style={{ color: '#fff' }}>Agenda</Link>
      </nav>
    </div>
  );
}