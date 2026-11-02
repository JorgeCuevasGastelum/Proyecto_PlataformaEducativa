interface MensajeErrorProps {
  mensaje: string;
  onReintentar: () => void;
}

export function MensajeError({ mensaje, onReintentar }: MensajeErrorProps) {
  return (
    <div className="error" role="alert">
      <p>{mensaje}</p>
      <button className="boton" onClick={onReintentar}>Reintentar</button>
    </div>
  );
}