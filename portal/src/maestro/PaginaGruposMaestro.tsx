import { Link } from "react-router";
import { useGruposMaestro } from "./useGruposMaestro";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { pluralizar } from "../compartido/formato";

export default function PaginaGruposMaestro() {
    const { grupos, cargando, error, reintentar } = useGruposMaestro();

    if (cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Mis grupos</h1>
                <p className="pagina__bajada">Entra a un grupo para ver su lista y capturar calificaciones.</p>
            </section>

            {grupos.length === 0 && (
                <section className="vacio">
                    <h2>No tienes grupos asignados</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto" }}>
                        Cuando control escolar te asigne uno aparecerá aquí.
                    </p>
                </section>
            )}

            <ul className="lista">
                {grupos.map((g) => (
                    <li key={g.grupoId} className="lista__renglon lista__renglon--enlace">
                        <div>
                            <Link to={`/maestro/grupos/${g.grupoId}`} className="lista__titulo">{g.materiaNombre}</Link>
                            <p className="lista__meta">Grupo {g.grupoClave} · {g.periodoClave}</p>
                        </div>
                        <p className="lista__meta">{pluralizar(g.inscritos, "alumno", "alumnos")}</p>
                    </li>
                ))}
            </ul>
        </>
    );
}