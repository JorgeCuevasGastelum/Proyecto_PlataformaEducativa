import { Link, NavLink, useNavigate } from 'react-router';
import { useSesion } from '../../sesion/SesionContext';
import { useMaterias } from '../../materias/estado';
import type { Rol } from '../tipos';

interface Enlace {
  a: string;
  texto: string;
}

const ENLACES_DEL_ALUMNO: Enlace[] = [
  { a: '/oferta', texto: 'Oferta de grupos' },
  { a: '/materias', texto: 'Mis materias' },
  { a: '/horario', texto: 'Horario' },
  { a: '/historial', texto: 'Historial' },
  { a: '/avisos', texto: 'Avisos' },
  { a: '/pagos', texto: 'Pagos' },
];

const ENLACES_DEL_MAESTRO: Enlace[] = [
  { a: '/maestro/grupos', texto: 'Mis grupos' },
];

function enlacesDe(rol: Rol | undefined): Enlace[] {
  if (rol === 'alumno') return ENLACES_DEL_ALUMNO;
  if (rol === 'maestro') return ENLACES_DEL_MAESTRO;
  return [];
}

function claseEnlace({ isActive }: { isActive: boolean }) {
  return isActive ? 'barra__enlace barra__enlace--activo' : 'barra__enlace';
}

export function Encabezado() {
  const { usuario, salir } = useSesion();
  const total = useMaterias((estado) => estado.lista.length);
  const navegar = useNavigate();
  const enlaces = enlacesDe(usuario?.rol);

  function cerrarSesion() {
    navegar('/entrar', { replace: true });
    salir();
  }

  return (
    <header className="barra">
      <div className="barra__interior">
        <Link to="/" className="barra__marca">
          <img src="/logo.svg" alt="" />
          Plataforma Educativa
        </Link>

        <nav aria-label="Secciones del portal" className="barra__nav">
          <ul className="barra__enlaces">
            {enlaces.map((enlace) => (
              <li key={enlace.a}>
                <NavLink to={enlace.a} className={claseEnlace}>
                  {enlace.texto}
                  {enlace.a === '/materias' && <span className="barra__contador">{total}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="barra__sesion">
          {usuario ? (
            <>
              <span className="barra__usuario">{usuario.correo}</span>
              <button className="boton boton--secundario boton--chico" onClick={cerrarSesion}>Salir</button>
            </>
          ) : (
            <Link to="/entrar" className="boton boton--chico">Entrar</Link>
          )}
        </div>
      </div>
    </header>
  );
}