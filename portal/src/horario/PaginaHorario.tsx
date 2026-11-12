import { Link } from "react-router";
import { useHorario } from "./useHorario";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { DIAS_DE_LA_SEMANA, NOMBRE_DEL_DIA, rangoDeHoras } from "../compartido/formato";
import type { RenglonDeHorario } from "../compartido/tipos";

function renglonesDelDia(renglones: RenglonDeHorario[], dia: string): RenglonDeHorario[] {
    const delDia: RenglonDeHorario[] = [];
    for (const renglon of renglones) {
        if (renglon.diaSemana === dia) delDia.push(renglon);
    }
    delDia.sort(function (a, b) {
        return a.minutoInicio - b.minutoInicio;
    });
    return delDia;
}

export default function PaginaHorario() {
    const { renglones, cargando, error, reintentar } = useHorario();

    if (cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Horario</h1>
                <p className="pagina__bajada">Tus clases de la semana.</p>
            </section>

            {renglones.length === 0 && (
                <section className="vacio">
                    <h2>Tu horario está vacío</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto 1.2rem" }}>
                        Todavía no tienes materias inscritas, por eso no hay clases.
                    </p>
                    <Link to="/oferta" className="boton">Ver la oferta</Link>
                </section>
            )}

            <div className="semana">
                {renglones.length > 0 && DIAS_DE_LA_SEMANA.map((dia) => {
                    const delDia = renglonesDelDia(renglones, dia);
                    if (delDia.length === 0 && dia === "sabado") return null;

                    return (
                        <section key={dia} className="dia">
                            <h2>{NOMBRE_DEL_DIA[dia]}</h2>
                            {delDia.length === 0 && <p className="lista__meta">Sin clases</p>}
                            <ul className="lista">
                                {delDia.map((r) => (
                                    <li key={`${r.minutoInicio}-${r.grupoClave}`} className="lista__renglon lista__renglon--columna">
                                        <p className="lista__meta">{rangoDeHoras(r.minutoInicio, r.minutoFin)}</p>
                                        <p className="lista__titulo">{r.materiaNombre}</p>
                                        <p className="lista__meta">Grupo {r.grupoClave} · {r.maestroNombre}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </>
    );
}