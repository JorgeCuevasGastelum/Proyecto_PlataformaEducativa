import { useEffect, useState } from 'react';
import { mensajeDeError } from './servicios/api';
import { traerPeriodos } from './servicios/periodos';
import type { PeriodoEscolar } from './tipos';

export function usePeriodos() {
  const [periodos, setPeriodos] = useState<PeriodoEscolar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerPeriodos()
      .then((lista) => { if (vigente) setPeriodos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudieron obtener los períodos escolares.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  return { periodos, cargando, error, reintentar };
}