import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { GrupoDeCatalogo } from '../compartido/tipos';
import { traerGrupos } from './servicio';

export function useGrupo(id: number) {
  const [grupo, setGrupo] = useState<GrupoDeCatalogo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError(null);
    traerGrupos()
      .then((lista) => {
        if (!vigente) return;
        const encontrado = lista.find((g) => g.grupoId === id);
        setGrupo(encontrado ?? null);
      })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudieron obtener los detalles del grupo.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id, intento]);

  function reintentar() {
    setIntento((n) => n + 1);
  }

  return { grupo, cargando, error, reintentar };
}