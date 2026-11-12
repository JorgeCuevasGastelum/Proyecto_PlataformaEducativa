import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { Aviso } from '../compartido/tipos';
import { traerAvisos } from './servicio';

export function useAvisos(periodoId: number | null) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (periodoId === null) {
      setAvisos([]);
      setCargando(false);
      return;
    }

    let vigente = true;
    setCargando(true);
    setError(null);
    traerAvisos(periodoId)
      .then((lista) => { if (vigente) setAvisos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudieron obtener los avisos.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [periodoId, intento]);

  function reintentar() {
    setIntento((n) => n + 1);
  }

  return { avisos, cargando, error, reintentar };
}