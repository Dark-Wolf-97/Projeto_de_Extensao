export default function PacienteList({ pacientes, onDelete, onEdit }) {
  return (
    <div>
      <h2>Lista de Pacientes</h2>

      <ul>
        {pacientes.map((p, index) => (
          <li key={index}>
            {p.nome} - {p.telefone}
            <button onClick={() => onEdit(p, index)}>Editar</button>
            <button onClick={() => onDelete(index)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}