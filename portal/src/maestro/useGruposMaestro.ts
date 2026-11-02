import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { GrupoDelMaestro } from '../compartido/tipos';
import { traerMisGrupos } from './servicio';

export function useGruposMaestro() {
  const [grupos, setGrupos] = useState<GrupoDelMaestro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerMisGrupos()
      .then((lista) => { if (vigente) setGrupos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudieron obtener tus grupos.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  return { grupos, cargando, error, reintentar };
}