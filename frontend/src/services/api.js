const API_URL = 'http://localhost:3000';

export const getPacientes = async () => {
  const res = await fetch(`${API_URL}/pacientes`);
  return res.json();
};

export const criarPaciente = async (paciente) => {
  await fetch(`${API_URL}/pacientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paciente)
  });
};

export const atualizarPaciente = async (id, paciente) => {
  await fetch(`http://localhost:3000/pacientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paciente)
  });
};

export const deletarPaciente = async (id) => {
  await fetch(`${API_URL}/pacientes/${id}`, {
    method: 'DELETE'
  });
};

export const buscarPaciente = async (nome) => {
  const res = await fetch(`${API_URL}/pacientes/buscar?nome=${nome}`);
  return res.json();
};

export const getConsultas = async () => {
  const res = await fetch('http://localhost:3000/consultas');
  return res.json();
};

export const criarConsulta = async (consulta) => {
  await fetch('http://localhost:3000/consultas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consulta),
  });
};

export const atualizarConsulta = async (id, consulta) => {
  await fetch(`http://localhost:3000/consultas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(consulta),
  });
};

export const deletarConsulta = async (id) => {
  await fetch(`http://localhost:3000/consultas/${id}`, {
    method: 'DELETE',
  });
};