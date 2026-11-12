import { useEffect, useState } from 'react';
import { mensajeDeError } from '../compartido/servicios/api';
import type { RenglonDeHorario } from '../compartido/tipos';
import { traerHorario } from './servicio';

export function useHorario() {
  const [renglones, setRenglones] = useState<RenglonDeHorario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    traerHorario()
      .then((lista) => { if (vigente) setRenglones(lista); })
      .catch((e) => { if (vigente) setError(mensajeDeError(e, 'No se pudo obtener tu horario.')); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [intento]);

  function reintentar() {
    setCargando(true);
    setError(null);
    setIntento((n) => n + 1);
  }

  return { renglones, cargando, error, reintentar };
}