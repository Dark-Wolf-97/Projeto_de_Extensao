import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Pacientes from './pages/Paciente';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Consulta';

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', width: '100vw', height: '100vh' }}>
        <Sidebar />

        <div style={{ marginLeft: '200px', padding: '20px', width: '100%' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/agenda" element={<Agenda />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;