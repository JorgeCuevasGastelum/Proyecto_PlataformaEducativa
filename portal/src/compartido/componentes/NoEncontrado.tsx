import { Link } from 'react-router';

export function NoEncontrado() {
  return (
    <section className="vacio">
      <div className="vacio__codigo">404</div>
      <h1>Esta página no existe</h1>
      <p className="pagina__bajada" style={{ margin: '0 auto 1.2rem' }}>
        Revisa la dirección, o regresa al inicio.
      </p>
      <Link to="/" className="boton">Ir al inicio</Link>
    </section>
  );
}