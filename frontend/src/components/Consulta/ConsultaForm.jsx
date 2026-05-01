import { useEffect, useState } from 'react';
import { getPacientes } from '../../services/api';

export default function ConsultaForm({ onSalvar, consultaEditando }) {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState('');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');

  // 🔹 carregar pacientes
  useEffect(() => {
    const carregarPacientes = async () => {
      const data = await getPacientes();
      setPacientes(data);
    };

    carregarPacientes();
  }, []);

  // 🔹 preencher ao editar
  useEffect(() => {
    if (consultaEditando) {
      setPacienteId(consultaEditando.pacienteId);
      setData(consultaEditando.data);
      setHora(consultaEditando.hora);
    }
  }, [consultaEditando]);

  const handleSubmit = async () => {
    await onSalvar({ pacienteId, data, hora });

    setPacienteId('');
    setData('');
    setHora('');
  };

  return (
    <div>
      <h2>Consulta</h2>

      <select
        value={pacienteId}
        onChange={(e) => setPacienteId(e.target.value)}
      >
        <option value="">Selecione um paciente</option>

        {pacientes.map((p, index) => (
          <option key={index} value={index}>
            {p.nome}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <input
        type="time"
        value={hora}
        onChange={(e) => setHora(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {consultaEditando ? 'Atualizar' : 'Agendar'}
      </button>
    </div>
  );
}