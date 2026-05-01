import { useEffect, useState } from 'react';
import ConsultaForm from '../components/Consulta/ConsultaForm';
import ConsultaList from '../components/Consulta/ConsultaList';
import { getPacientes } from '../services/api';
import Modal from '../components/Modal/Modal';

import {
  getConsultas,
  criarConsulta,
  atualizarConsulta,
  deletarConsulta
} from '../services/api';

export default function Consultas() {
  const [consultas, setConsultas] = useState([]);
  const [consultaEditando, setConsultaEditando] = useState(null);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [pacientes, setPacientes] = useState([]);

  const carregar = async () => {
    const dataConsultas = await getConsultas();
    const dataPacientes = await getPacientes();

    setConsultas(dataConsultas);
    setPacientes(dataPacientes);
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSalvar = async (consulta) => {
    if (editandoIndex !== null) {
      await atualizarConsulta(editandoIndex, consulta);
    } else {
      await criarConsulta(consulta);
    }

    setConsultaEditando(null);
    setEditandoIndex(null);
    setModalAberto(false);

    carregar();
  };

  const handleEdit = (consulta, index) => {
    setConsultaEditando({ ...consulta });
    setEditandoIndex(index);
    setModalAberto(true);
  };

  const handleDelete = async (id) => {
    await deletarConsulta(id);
    carregar();
  };

  return (
    <div>
      <h1>Consultas</h1>

      <button onClick={() => setModalAberto(true)}>
        Nova Consulta
      </button>

      <ConsultaList
        consultas={consultas}
        pacientes={pacientes}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {modalAberto && (
        <Modal onClose={() => setModalAberto(false)}>
          <ConsultaForm
            onSalvar={handleSalvar}
            consultaEditando={consultaEditando}
          />
        </Modal>
      )}
    </div>
  );
}