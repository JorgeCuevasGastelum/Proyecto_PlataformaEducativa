import { useState } from "react";
import { Link } from "react-router";
import { useOferta } from "./useOferta";
import { useRestricciones } from "./useRestricciones";
import { inscribirse } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { estaVencido, resumenDeHorario } from "../compartido/formato";
import { usePagos } from "../pagos/usePagos";
import { mensajeDeError } from "../compartido/servicios/api";
import { periodoAbierto } from "../compartido/servicios/periodos";
import { usePeriodos } from "../compartido/usePeriodos";
import { useMaterias } from "../materias/estado";
import type { GrupoDeCatalogo } from "../compartido/tipos";

// El aviso se muestra dentro de la tarjeta del grupo que se intentó inscribir,
// para que se vea aunque el grupo esté hasta abajo de la lista.
interface Aviso {
    grupoId: number;
    tipo: "exito" | "error";
    texto: string;
}

export default function PaginaOferta() {
    const { grupos, cargando, error, reintentar } = useOferta();
    const periodos = usePeriodos();
    const requisitos = useRestricciones();
    const cuenta = usePagos();

    const inscritas = useMaterias((estado) => estado.lista);
    const cargarMaterias = useMaterias((estado) => estado.cargar);

    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [ocupado, setOcupado] = useState<number | null>(null);

    if (cargando || periodos.cargando || requisitos.cargando || cuenta.cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;
    if (periodos.error) return <MensajeError mensaje={periodos.error} onReintentar={periodos.reintentar} />;
    if (requisitos.error) return <MensajeError mensaje={requisitos.error} onReintentar={requisitos.reintentar} />;
    if (cuenta.error) return <MensajeError mensaje={cuenta.error} onReintentar={cuenta.reintentar} />;

    const abierto = periodoAbierto(periodos.periodos);

    // Si debe la inscripción del período o tiene un pago vencido, el servicio no lo va a dejar
    // inscribirse; se le avisa desde antes en lugar de esperar a que le dé clic al botón.
    let pendienteDePago: string | null = null;
    for (const p of cuenta.pagos) {
        if (abierto && p.periodoId === abierto.id && p.concepto === "inscripcion" && p.estado === "pendiente") {
            pendienteDePago = `Debes pagar tu inscripción de ${abierto.clave} para poder inscribir materias.`;
        }
    }
    for (const p of cuenta.pagos) {
        if (estaVencido(p)) {
            pendienteDePago = "Tienes un pago vencido. Mientras no lo pagues no puedes inscribir materias.";
        }
    }

    async function inscribir(grupo: GrupoDeCatalogo) {
        setOcupado(grupo.grupoId);
        setAviso(null);

        try {
            await inscribirse(grupo.grupoId);
            setAviso({ grupoId: grupo.grupoId, tipo: "exito", texto: `Te inscribiste a ${grupo.materiaNombre}.` });
            await cargarMaterias();
            reintentar();
        } catch (e) {
            setAviso({ grupoId: grupo.grupoId, tipo: "error", texto: mensajeDeError(e, "No se pudo completar la inscripción.") });
        } finally {
            setOcupado(null);
        }
    }

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Oferta de grupos</h1>
                <p className="pagina__bajada">Elige los grupos de tu carga académica. Puedes inscribirte a varios.</p>
            </section>

            {pendienteDePago && (
                <p className="aviso aviso--advertencia">
                    {pendienteDePago} <Link to="/pagos">Ir a Pagos</Link>
                </p>
            )}

            {grupos.length === 0 && (
                <section className="vacio">
                    <h2>No hay grupos disponibles</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto 1.2rem" }}>
                        {abierto
                            ? "La carga está abierta pero todavía no hay grupos."
                            : "La carga académica no está abierta."}
                    </p>
                    <Link to="/avisos" className="boton">Ver avisos</Link>
                </section>
            )}

            <ul className="lista">
                {grupos.map((g) => {
                    let accion = (
                        <button className="boton boton--chico" onClick={() => inscribir(g)} disabled={ocupado !== null}>
                            {ocupado === g.grupoId ? "Inscribiendo..." : "Inscribirme"}
                        </button>
                    );

                    if (g.disponibles === 0) {
                        accion = <span className="etiqueta etiqueta--ambar">Sin lugares</span>;
                    }
                    const restriccion = requisitos.restriccionDe(g);
                    if (restriccion !== null) {
                        accion = <span className="etiqueta etiqueta--ambar">{restriccion}</span>;
                    }
                    for (const i of inscritas) {
                        if (i.materiaClave !== g.materiaClave) continue;
                        if (i.grupoClave === g.grupoClave) {
                            accion = <span className="etiqueta etiqueta--verde">Ya estás inscrito</span>;
                        } else {
                            accion = <span className="etiqueta etiqueta--azul">Ya llevas esta materia</span>;
                        }
                    }

                    return (
                        <li key={g.grupoId} className="lista__renglon lista__renglon--enlace">
                            <div>
                                <Link to={`/oferta/${g.grupoId}`} className="lista__titulo">{g.materiaNombre}</Link>
                                <p className="lista__meta">
                                    {g.materiaClave} · grupo {g.grupoClave} · {g.creditos} créditos · {g.maestroNombre}
                                </p>
                                <p className="lista__meta">{resumenDeHorario(g.horario)}</p>
                                {aviso && aviso.grupoId === g.grupoId && (
                                    <p className={`aviso aviso--${aviso.tipo} lista__aviso`}>{aviso.texto}</p>
                                )}
                            </div>
                            <p className="lista__meta">{g.disponibles} de {g.cupoMaximo} lugares</p>
                            {accion}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}