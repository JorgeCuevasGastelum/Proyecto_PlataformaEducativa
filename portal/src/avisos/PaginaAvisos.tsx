import { useState } from "react";
import { useAvisos } from "./useAvisos";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { fecha } from "../compartido/formato";
import { periodoAbierto } from "../compartido/servicios/periodos";
import { usePeriodos } from "../compartido/usePeriodos";

export default function PaginaAvisos() {
    const periodos = usePeriodos();
    const [elegido, setElegido] = useState<number | null>(null);

    let seleccionado = elegido;
    if (seleccionado === null) {
        const abierto = periodoAbierto(periodos.periodos);
        if (abierto) seleccionado = abierto.id;
    }

    const { avisos, cargando, error, reintentar } = useAvisos(seleccionado);

    if (periodos.cargando) return <Cargando />;
    if (periodos.error) return <MensajeError mensaje={periodos.error} onReintentar={periodos.reintentar} />;

    return (
        <>
            <section className="pagina__encabezado">
                <h1>Avisos escolares</h1>
                <p className="pagina__bajada">Comunicados de control escolar por período.</p>
            </section>

            <div className="filtro">
                <label className="campo__etiqueta">Período</label>
                <select className="campo__control" value={seleccionado ?? ""} onChange={(e) => setElegido(Number(e.target.value))}>
                    {periodos.periodos.map((p) => (
                        <option key={p.id} value={p.id}>{p.clave}</option>
                    ))}
                </select>
            </div>

            {cargando && <Cargando />}
            {error && <MensajeError mensaje={error} onReintentar={reintentar} />}

            {!cargando && !error && avisos.length === 0 && (
                <section className="vacio">
                    <h2>No hay avisos en este período</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto" }}>
                        Control escolar no ha publicado comunicados. Prueba con otro período.
                    </p>
                </section>
            )}

            <ul className="lista">
                {avisos.map((a) => (
                    <li key={a.id} className="lista__renglon lista__renglon--columna">
                        <h2>{a.titulo}</h2>
                        <p className="lista__meta">{fecha(a.fechaPublicacion)}</p>
                        <p>{a.contenido}</p>
                    </li>
                ))}
            </ul>
        </>
    );
}