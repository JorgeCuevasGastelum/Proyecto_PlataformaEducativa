import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { Pago } from '../compartido/tipos';
import { traerPagos } from './servicio';

export function usePagos() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerPagos()
      .then((lista) => { if (vigente) setPagos(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudo obtener tu estado de cuenta.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  return { pagos, cargando, error, reintentar };
}