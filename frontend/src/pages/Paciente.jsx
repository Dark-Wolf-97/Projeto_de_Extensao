import { useEffect, useState } from 'react';
import PacienteForm from '../components/Paciente/PacienteForm';
import PacienteList from '../components/Paciente/PacienteList';
import Modal from '../components/Modal/Modal';
import {
  getPacientes,
  criarPaciente,
  atualizarPaciente,
  deletarPaciente,
  buscarPaciente
} from '../services/api';

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [modal, setModal] = useState(false);

  const carregarPacientes = async () => {
    const data = await getPacientes();
    setPacientes(data);
  };

  useEffect(() => {
    carregarPacientes();
  }, []);

  const handleCadastrar = async (paciente) => {
    if (editandoIndex !== null) {
      await atualizarPaciente(editandoIndex, paciente);
    } else {
      await criarPaciente(paciente);
    }

    setPacienteEditando(null);
    setEditandoIndex(null);
    setModal(false);

    carregarPacientes();
  };

  const handleEdit = (paciente, index) => {
    setPacienteEditando({ ...paciente });
    setEditandoIndex(index);
    setModal(true);
  };

  const handleDelete = async (id) => {
    await deletarPaciente(id);
    carregarPacientes();
  };

  const handleBuscar = async () => {
    const data = await buscarPaciente(busca);
    setPacientes(data);
  };

  const handleNovoPaciente = () => {
    setPacienteEditando(null);
    setEditandoIndex(null);
    setModal(true);
  };

  return (
    <div>
      <h1>Pacientes</h1>

      <input
        placeholder="Buscar paciente"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <button onClick={handleBuscar}>Buscar</button>

      <br /><br />

      <button onClick={handleNovoPaciente}>
        Adicionar Paciente
      </button>

      <PacienteList 
        pacientes={pacientes} 
        onDelete={handleDelete} 
        onEdit={handleEdit}
      />

    {modal && (
    <Modal onClose={() => setModal(false)}>
      <PacienteForm
        onCadastrar={handleCadastrar}
        pacienteEditando={pacienteEditando}
      />
    </Modal>
  )}
    </div>
  );
}