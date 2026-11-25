import { estaVencido } from "../compartido/formato";
import type { Pago, PeriodoEscolar } from "../compartido/tipos";

// Si debe la inscripción del período abierto o tiene un pago vencido, el servicio no lo deja
// inscribirse (RN-17 y RN-18). Regresa el motivo para avisarle, o null si puede inscribirse.
export function motivoDePagoPendiente(pagos: Pago[], abierto: PeriodoEscolar | undefined): string | null {
    for (const p of pagos) {
        if (estaVencido(p)) {
            return "Tienes un pago vencido. Mientras no lo pagues no puedes inscribir materias.";
        }
    }

    for (const p of pagos) {
        if (abierto && p.periodoId === abierto.id && p.concepto === "inscripcion" && p.estado === "pendiente") {
            return `Debes pagar tu inscripción de ${abierto.clave} para poder inscribir materias.`;
        }
    }

    return null;
}
