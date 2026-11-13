import { useState } from "react";
import { Link } from "react-router";
import { useMaterias } from "./estado";
import { darDeBaja } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { usePeriodos } from "../compartido/usePeriodos";
import { periodoAbierto } from "../compartido/servicios/periodos";
import { mensajeDeError } from "../compartido/servicios/api";
import { pluralizar } from "../compartido/formato";

interface Aviso {
    tipo: "exito" | "error";
    texto: string;
}

export default function PaginaMaterias() {
    const { lista: materias, cargando, error, cargar } = useMaterias();
    const periodos = usePeriodos();

    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [ocupado, setOcupado] = useState(false);

    if (cargando || periodos.cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={cargar} />;
    if (periodos.error) return <MensajeError mensaje={periodos.error} onReintentar={periodos.reintentar} />;

    const abierto = periodoAbierto(periodos.periodos);

    let creditos = 0;
    for (const m of materias) {
        creditos = creditos + m.creditos;
    }

    async function baja(inscripcionId: number, nombre: string) {
        setOcupado(true);
        setAviso(null);

        try {
            await darDeBaja(inscripcionId);
            setAviso({ tipo: "exito", texto: `Te diste de baja de ${nombre}.` });
            await cargar();
        } catch (e) {
            setAviso({ tipo: "error", texto: mensajeDeError(e, "No se pudo dar de baja la materia.") });
        } finally {
            setOcupado(false);
        }
    }

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Mis materias</h1>
                <p className="pagina__bajada">
                    {abierto
                        ? `${pluralizar(materias.length, "materia", "materias")} en ${abierto.clave}: ${creditos} de ${abierto.creditosMaximos} créditos`
                        : "No hay una carga académica abierta"}
                </p>
            </section>

            {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}

            {materias.length === 0 && (
                <section className="vacio">
                    <h2>Todavía no tienes materias inscritas</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto 1.2rem" }}>
                        {abierto
                            ? "Elige tus grupos en la oferta."
                            : "Las materias aparecen cuando control escolar abre la carga."}
                    </p>
                    <Link to="/oferta" className="boton">Ver la oferta</Link>
                </section>
            )}

            <ul className="lista">
                {materias.map((m) => (
                    <li key={m.inscripcionId} className="lista__renglon">
                        <div>
                            <p className="lista__titulo">{m.materiaNombre}</p>
                            <p className="lista__meta">
                                {m.materiaClave} · grupo {m.grupoClave} · {m.creditos} créditos
                            </p>
                        </div>
                        {abierto && (
                            <button
                                className="boton boton--secundario boton--chico"
                                onClick={() => baja(m.inscripcionId, m.materiaNombre)}
                                disabled={ocupado}
                            >
                                Dar de baja
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </>
    );
}