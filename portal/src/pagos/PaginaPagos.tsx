import { useState } from "react";
import { usePagos } from "./usePagos";
import { pagarCargo } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { dinero, estaVencido, fecha, nombreDelConcepto } from "../compartido/formato";
import { mensajeDeError } from "../compartido/servicios/api";
import { usePeriodos } from "../compartido/usePeriodos";
import type { Pago } from "../compartido/tipos";

interface Aviso {
    tipo: "exito" | "error";
    texto: string;
}

export default function PaginaPagos() {
    const { pagos, cargando, error, reintentar } = usePagos();
    const periodos = usePeriodos();

    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [ocupado, setOcupado] = useState(false);

    if (cargando || periodos.cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;
    if (periodos.error) return <MensajeError mensaje={periodos.error} onReintentar={periodos.reintentar} />;

    async function pagar(pago: Pago) {
        setOcupado(true);
        setAviso(null);

        try {
            await pagarCargo(pago.id);
            setAviso({ tipo: "exito", texto: `Registramos tu pago de ${nombreDelConcepto(pago.concepto).toLowerCase()}.` });
            reintentar();
        } catch (e) {
            setAviso({ tipo: "error", texto: mensajeDeError(e, "No se pudo registrar el pago.") });
        } finally {
            setOcupado(false);
        }
    }

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Pagos</h1>
                <p className="pagina__bajada">
                    Sin la inscripción pagada y sin adeudos vencidos no puedes inscribir materias.
                </p>
            </section>

            {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}

            {pagos.length === 0 && (
                <section className="vacio">
                    <h2>No tienes cargos registrados</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto" }}>
                        Tus cargos aparecen cuando control escolar abre un período.
                    </p>
                </section>
            )}

            <ul className="lista">
                {pagos.map((p) => {
                    let periodo = "";
                    for (const per of periodos.periodos) {
                        if (per.id === p.periodoId) periodo = per.clave;
                    }

                    let estado = <span className="etiqueta etiqueta--ambar">Pendiente</span>;
                    if (p.estado === "pagado") estado = <span className="etiqueta etiqueta--verde">Pagado</span>;
                    else if (estaVencido(p)) estado = <span className="etiqueta etiqueta--rojo">Vencido</span>;

                    return (
                        <li key={p.id} className="lista__renglon">
                            <div>
                                <p className="lista__titulo">{nombreDelConcepto(p.concepto)} {periodo}</p>
                                <p className="lista__meta">
                                    {p.estado === "pagado" && p.fechaPago
                                        ? `Pagado el ${fecha(p.fechaPago)}`
                                        : `Fecha límite: ${fecha(p.fechaLimite)}`}
                                </p>
                            </div>
                            <p className="lista__titulo pago__monto">{dinero(p.monto)}</p>
                            <div className="pago__estado">
                                {estado}
                                {p.estado === "pendiente" && (
                                    <button className="boton boton--chico" onClick={() => pagar(p)} disabled={ocupado}>
                                        Pagar
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}