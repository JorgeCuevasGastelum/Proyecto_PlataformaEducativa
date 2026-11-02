import { useState } from "react";
import { Link } from "react-router";
import { useOferta } from "./useOferta";
import { inscribirse } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { resumenDeHorario } from "../compartido/formato";
import { mensajeDeError } from "../compartido/servicios/api";
import { periodoAbierto } from "../compartido/servicios/periodos";
import { usePeriodos } from "../compartido/usePeriodos";
import { useMaterias } from "../materias/estado";
import type { GrupoDeCatalogo } from "../compartido/tipos";

interface Aviso {
    tipo: "exito" | "error";
    texto: string;
}

export default function PaginaOferta() {
    const { grupos, cargando, error, reintentar } = useOferta();
    const periodos = usePeriodos();

    const inscritas = useMaterias((estado) => estado.lista);
    const cargarMaterias = useMaterias((estado) => estado.cargar);

    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [ocupado, setOcupado] = useState<number | null>(null);

    if (cargando || periodos.cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;
    if (periodos.error) return <MensajeError mensaje={periodos.error} onReintentar={periodos.reintentar} />;

    const abierto = periodoAbierto(periodos.periodos);

    async function inscribir(grupo: GrupoDeCatalogo) {
        setOcupado(grupo.grupoId);
        setAviso(null);

        try {
            await inscribirse(grupo.grupoId);
            setAviso({ tipo: "exito", texto: `Te inscribiste a ${grupo.materiaNombre}.` });
            await cargarMaterias();
            reintentar();
        } catch (e) {
            setAviso({ tipo: "error", texto: mensajeDeError(e, "No se pudo completar la inscripción.") });
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

            {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}

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
                    for (const i of inscritas) {
                        if (i.materiaClave !== g.materiaClave) continue;
                        if (i.grupoClave === g.grupoClave) {
                            accion = <span className="etiqueta etiqueta--verde">Ya estás inscrito</span>;
                        } else {
                            accion = <span className="lista__meta">Ya llevas esta materia</span>;
                        }
                    }

                    return (
                        <li key={g.grupoId} className="lista__renglon">
                            <div>
                                <Link to={`/oferta/${g.grupoId}`} className="lista__titulo">{g.materiaNombre}</Link>
                                <p className="lista__meta">
                                    {g.materiaClave} · grupo {g.grupoClave} · {g.creditos} créditos · {g.maestroNombre}
                                </p>
                                <p className="lista__meta">{resumenDeHorario(g.horario)}</p>
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