import { CanDeactivateFn } from '@angular/router';

// Cualquier formulario que tenga tieneCambios() puede usar este aviso.
interface ConCambios {
  tieneCambios(): boolean;
}

export const cambiosSinGuardar: CanDeactivateFn<ConCambios> = (componente) => {
  if (!componente.tieneCambios()) return true;
  return confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?');
};
