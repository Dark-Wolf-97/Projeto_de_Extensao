import { useState, useEffect } from 'react';

export default function PacienteForm({ onCadastrar, pacienteEditando }) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    if (pacienteEditando) {
      setNome(pacienteEditando.nome);
      setTelefone(pacienteEditando.telefone);
    }
  }, [pacienteEditando]);

  const handleSubmit = async () => {
    await onCadastrar({ nome, telefone });
    setNome('');
    setTelefone('');
  };

  return (
    <div>
      <h2>
        {pacienteEditando ? 'Editar Paciente' : 'Cadastrar Paciente'}
      </h2>

      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        placeholder="Telefone"
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
      />

      <button onClick={handleSubmit}>
        {pacienteEditando ? 'Atualizar' : 'Cadastrar'}
      </button>
    </div>
  );
}