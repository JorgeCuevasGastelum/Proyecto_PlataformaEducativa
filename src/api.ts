import { crearAplicacion } from './app.js';
import { leerConfiguracion } from './config/configuracion.js';

const app = await crearAplicacion();
await app.listen(leerConfiguracion().port, '0.0.0.0');
