export default function ConsultaList({ consultas, pacientes, onDelete, onEdit }) {
  return (
    <div>
      <h2>Consultas</h2>

      <ul>
        {consultas.map((c, index) => {
          const paciente = pacientes[c.pacienteId];

          return (
            <li key={index}>
              Paciente: {paciente?.nome || 'Desconhecido'} | {c.data} - {c.hora}

              <button onClick={() => onEdit(c, index)}>Editar</button>
              <button onClick={() => onDelete(index)}>Excluir</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}