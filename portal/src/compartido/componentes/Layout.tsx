import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Cargando } from './Cargando.tsx';
import { Encabezado } from './Encabezado.tsx';
import { PiePagina } from './PiePagina.tsx';

export function Layout() {
  return (
    <div className="disposicion">
      <Encabezado />
      <main className="disposicion__contenido">
        <Suspense fallback={<Cargando />}>
          <Outlet />
        </Suspense>
      </main>
      <PiePagina />
    </div>
  );
}