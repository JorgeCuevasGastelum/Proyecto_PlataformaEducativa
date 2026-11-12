import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { GrupoDeCatalogo, Historial, Materia } from '../compartido/tipos';
import { traerHistorial } from '../historial/servicio';
import { traerMaterias } from './servicio';

function clavesAprobadas(historial: Historial[]): string[] {
  const claves: string[] = [];
  for (const periodo of historial) {
    for (const materia of periodo.materias) {
      if (materia.aprobada === true) claves.push(materia.materiaClave);
    }
  }
  return claves;
}

export function useRestricciones() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    Promise.all([traerMaterias(), traerHistorial()])
      .then(([listaMaterias, listaHistorial]) => {
        if (!vigente) return;
        setMaterias(listaMaterias);
        setHistorial(listaHistorial);
      })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudieron revisar los requisitos de las materias.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  function restriccionDe(grupo: GrupoDeCatalogo): string | null {
    const aprobadas = clavesAprobadas(historial);
    if (aprobadas.includes(grupo.materiaClave)) return 'Ya aprobaste esta materia';

    const materia = materias.find((m) => m.id === grupo.materiaId);
    if (!materia) return null;

    for (const id of materia.prerrequisitoIds) {
      const requisito = materias.find((m) => m.id === id);
      if (requisito && !aprobadas.includes(requisito.clave)) return `Requiere aprobar ${requisito.nombre}`;
    }
    return null;
  }

  return { restriccionDe, cargando, error, reintentar };
}