import { Link } from "react-router";
import { useHistorial } from "./useHistorial";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";

export default function PaginaHistorial() {
    const { periodos, cargando, error, reintentar } = useHistorial();

    if (cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Historial de cargas</h1>
                <p className="pagina__bajada">Tus materias y calificaciones por período.</p>
            </section>

            {periodos.length === 0 && (
                <section className="vacio">
                    <h2>Aún no tienes historial</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto 1.2rem" }}>
                        Se llena cuando te inscribes a materias. Las bajas no aparecen.
                    </p>
                    <Link to="/oferta" className="boton">Ver la oferta</Link>
                </section>
            )}

            {periodos.map((p) => (
                <section key={p.periodoClave} className="historial">
                    <h2>Período {p.periodoClave}</h2>
                    <div className="tabla-envoltura">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Materia</th>
                                    <th>Grupo</th>
                                    <th>Créditos</th>
                                    <th>Calificación</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.materias.map((m) => (
                                    <tr key={`${m.materiaClave}-${m.grupoClave}`}>
                                        <td>{m.materiaNombre}</td>
                                        <td>{m.grupoClave}</td>
                                        <td>{m.creditos}</td>
                                        <td>{m.calificacion === null ? "Sin capturar" : m.calificacion}</td>
                                        <td>
                                            {m.aprobada === null && <span className="etiqueta etiqueta--azul">En curso</span>}
                                            {m.aprobada === true && <span className="etiqueta etiqueta--verde">Aprobada</span>}
                                            {m.aprobada === false && <span className="etiqueta etiqueta--rojo">Reprobada</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </>
    );
}