import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { AlumnoEnLista, GrupoDelMaestro } from '../compartido/tipos';
import { traerAlumnos, traerMisGrupos } from './servicio';

export function useGrupoMaestro(id: number) {
  const [grupo, setGrupo] = useState<GrupoDelMaestro | null>(null);
  const [alumnos, setAlumnos] = useState<AlumnoEnLista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    traerMisGrupos()
      .then(async (lista) => {
        const encontrado = lista.find((g) => g.grupoId === id) ?? null;
        const delGrupo = encontrado ? await traerAlumnos(id) : [];
        if (!vigente) return;
        setGrupo(encontrado);
        setAlumnos(delGrupo);
      })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudo obtener el grupo.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id, intento]);

  function reintentar() {
    setIntento((n) => n + 1);
  }

  return { grupo, alumnos, cargando, error, reintentar };
}