import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './compartido/componentes/Layout';
import { NoEncontrado } from './compartido/componentes/NoEncontrado';
import { RutaProtegida } from './compartido/componentes/RutaProtegida';

const Inicio = lazy(() => import('./sesion/Inicio'));
const PaginaEntrar = lazy(() => import('./sesion/PaginaEntrar'));
const SinAcceso = lazy(() => import('./compartido/componentes/SinAcceso'));
const PaginaOferta = lazy(() => import('./oferta/PaginaOferta'));
const PaginaGrupo = lazy(() => import('./oferta/PaginaGrupo'));
const PaginaMaterias = lazy(() => import('./materias/PaginaMaterias'));
const PaginaHorario = lazy(() => import('./horario/PaginaHorario'));
const PaginaHistorial = lazy(() => import('./historial/PaginaHistorial'));
const PaginaAvisos = lazy(() => import('./avisos/PaginaAvisos'));
const PaginaPagos = lazy(() => import('./pagos/PaginaPagos'));
const PaginaGruposMaestro = lazy(() => import('./maestro/PaginaGruposMaestro'));
const PaginaCalificaciones = lazy(() => import('./maestro/PaginaCalificaciones'));

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="entrar" element={<PaginaEntrar />} />
        <Route path="sin-acceso" element={<SinAcceso />} />

        <Route element={<RutaProtegida rol="alumno" />}>
          <Route path="oferta" element={<PaginaOferta />} />
          <Route path="oferta/:grupoId" element={<PaginaGrupo />} />
          <Route path="materias" element={<PaginaMaterias />} />
          <Route path="horario" element={<PaginaHorario />} />
          <Route path="historial" element={<PaginaHistorial />} />
          <Route path="avisos" element={<PaginaAvisos />} />
          <Route path="pagos" element={<PaginaPagos />} />
        </Route>

        <Route element={<RutaProtegida rol="maestro" />}>
          <Route path="maestro/grupos" element={<PaginaGruposMaestro />} />
          <Route path="maestro/grupos/:grupoId" element={<PaginaCalificaciones />} />
        </Route>

        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}

export default App;