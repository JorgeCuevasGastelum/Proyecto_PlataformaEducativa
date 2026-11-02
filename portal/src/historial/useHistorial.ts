import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { Historial } from '../compartido/tipos';
import { traerHistorial } from './servicio';

export function useHistorial() {
  const [periodos, setPeriodos] = useState<Historial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerHistorial()
      .then((lista) => { if (vigente) setPeriodos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudo obtener tu historial.')); })
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