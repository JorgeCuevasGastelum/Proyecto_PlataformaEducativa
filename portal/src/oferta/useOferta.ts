import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { GrupoDeCatalogo } from '../compartido/tipos';
import { traerGrupos } from './servicio';

export function useOferta() {
  const [grupos, setGrupos] = useState<GrupoDeCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerGrupos()
      .then((lista) => { if (vigente) setGrupos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudo obtener la oferta de grupos.')); })
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