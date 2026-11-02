import { useState } from "react";
import { Link, useParams } from "react-router";
import { useGrupo } from "./useGrupo";
import { inscribirse } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { NoEncontrado } from "../compartido/componentes/NoEncontrado";
import { NOMBRE_DEL_DIA, rangoDeHoras } from "../compartido/formato";
import { mensajeDeError } from "../compartido/servicios/api";
import { useMaterias } from "../materias/estado";

interface Aviso {
    tipo: "exito" | "error";
    texto: string;
}

export default function PaginaGrupo() {
    const { grupoId } = useParams();

    const { grupo, cargando, error, reintentar } = useGrupo(Number(grupoId));

    const inscritas = useMaterias((estado) => estado.lista);
    const cargarMaterias = useMaterias((estado) => estado.cargar);

    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [ocupado, setOcupado] = useState(false);

    if (cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;
    if (!grupo) return <NoEncontrado />;

    const elegido = grupo;

    async function inscribir() {
        setOcupado(true);
        setAviso(null);

        try {
            await inscribirse(elegido.grupoId);
            setAviso({ tipo: "exito", texto: `Te inscribiste a ${elegido.materiaNombre}.` });
            await cargarMaterias();
            reintentar();
        } catch (e) {
            setAviso({ tipo: "error", texto: mensajeDeError(e, "No se pudo completar la inscripción.") });
        } finally {
            setOcupado(false);
        }
    }

    let accion = (
        <button className="boton" onClick={inscribir} disabled={ocupado}>
            {ocupado ? "Inscribiendo..." : "Inscribirme"}
        </button>
    );

    if (elegido.disponibles === 0) {
        accion = <span className="etiqueta etiqueta--ambar">Sin lugares</span>;
    }
    for (const i of inscritas) {
        if (i.materiaClave !== elegido.materiaClave) continue;
        if (i.grupoClave === elegido.grupoClave) {
            accion = <span className="etiqueta etiqueta--verde">Ya estás inscrito</span>;
        } else {
            accion = <span className="lista__meta">Ya llevas esta materia en otro grupo</span>;
        }
    }

    return (
        <>
            <Link to="/oferta" className="detalle__volver">← Toda la oferta</Link>

            <section className="pagina__encabezado">
                <h1>{elegido.materiaNombre}</h1>
                <p className="pagina__bajada">Grupo {elegido.grupoClave} · {elegido.periodoClave}</p>
            </section>

            {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}

            <dl className="ficha">
                <div><dt>Clave</dt><dd>{elegido.materiaClave}</dd></div>
                <div><dt>Créditos</dt><dd>{elegido.creditos}</dd></div>
                <div><dt>Maestro</dt><dd>{elegido.maestroNombre}</dd></div>
                <div><dt>Lugares</dt><dd>{elegido.disponibles} de {elegido.cupoMaximo}</dd></div>
            </dl>

            <h2>Horario</h2>
            <ul className="lista">
                {elegido.horario.map((b) => (
                    <li key={`${b.diaSemana}-${b.minutoInicio}`} className="lista__renglon">
                        <p className="lista__titulo">{NOMBRE_DEL_DIA[b.diaSemana]}</p>
                        <p className="lista__meta">{rangoDeHoras(b.minutoInicio, b.minutoFin)}</p>
                    </li>
                ))}
            </ul>

            <div className="detalle__accion">{accion}</div>
        </>
    );
}