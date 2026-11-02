import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useGrupoMaestro } from "./useGrupoMaestro";
import { capturarCalificaciones } from "./servicio";
import { Cargando } from "../compartido/componentes/Cargando";
import { MensajeError } from "../compartido/componentes/MensajeError";
import { NoEncontrado } from "../compartido/componentes/NoEncontrado";
import { mensajeDeError } from "../compartido/servicios/api";
import type { AlumnoEnLista, CapturaDeCalificacion } from "../compartido/tipos";

interface Aviso {
    tipo: "exito" | "error";
    texto: string;
}

interface FormularioProps {
    grupoId: number;
    alumnos: AlumnoEnLista[];
}

function FormularioCalificaciones({ grupoId, alumnos }: FormularioProps) {
    const [valores, setValores] = useState<Record<number, string>>({});
    const [errores, setErrores] = useState<Record<number, string>>({});
    const [aviso, setAviso] = useState<Aviso | null>(null);
    const [enviando, setEnviando] = useState(false);

    function valorDe(alumno: AlumnoEnLista): string {
        if (valores[alumno.inscripcionId] !== undefined) return valores[alumno.inscripcionId];
        if (alumno.calificacion === null) return "";
        return String(alumno.calificacion);
    }

    async function guardar(e: FormEvent) {
        e.preventDefault();
        setAviso(null);

        const nuevosErrores: Record<number, string> = {};
        const capturas: CapturaDeCalificacion[] = [];

        for (const alumno of alumnos) {
            const texto = valorDe(alumno).trim();
            if (texto === "") continue;

            const numero = Number(texto);
            if (!Number.isInteger(numero) || numero < 0 || numero > 100) {
                nuevosErrores[alumno.inscripcionId] = "Escribe un entero del 0 al 100.";
            } else {
                capturas.push({ inscripcionId: alumno.inscripcionId, calificacion: numero });
            }
        }

        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        if (capturas.length === 0) {
            setAviso({ tipo: "error", texto: "Escribe al menos una calificación." });
            return;
        }

        setEnviando(true);

        try {
            await capturarCalificaciones(grupoId, capturas);
            setAviso({ tipo: "exito", texto: "Guardamos las calificaciones." });
        } catch (e) {
            setAviso({ tipo: "error", texto: mensajeDeError(e, "No se pudieron guardar las calificaciones.") });
        } finally {
            setEnviando(false);
        }
    }

    return (
        <form onSubmit={guardar} noValidate>
            {aviso && <p className={`aviso aviso--${aviso.tipo}`}>{aviso.texto}</p>}

            <ul className="lista">
                {alumnos.map((a) => (
                    <li key={a.inscripcionId} className="lista__renglon">
                        <div>
                            <p className="lista__titulo">{a.nombre}</p>
                            <p className="lista__meta">Matrícula {a.matricula}</p>
                        </div>
                        <label className="campo campo--calificacion">
                            <span className="campo__etiqueta">Calificación</span>
                            <input
                                className={errores[a.inscripcionId] ? "campo__control campo__control--error" : "campo__control"}
                                value={valorDe(a)}
                                onChange={(e) => setValores({ ...valores, [a.inscripcionId]: e.target.value })}
                            />
                            {errores[a.inscripcionId] && <p className="campo__error">{errores[a.inscripcionId]}</p>}
                        </label>
                    </li>
                ))}
            </ul>

            <div className="formulario__acciones">
                <button className="boton" type="submit" disabled={enviando}>
                    {enviando ? "Guardando..." : "Guardar calificaciones"}
                </button>
            </div>
        </form>
    );
}

export default function PaginaCalificaciones() {
    const { grupoId } = useParams();
    const { grupo, alumnos, cargando, error, reintentar } = useGrupoMaestro(Number(grupoId));

    if (cargando) return <Cargando />;
    if (error) return <MensajeError mensaje={error} onReintentar={reintentar} />;
    if (!grupo) return <NoEncontrado />;

    return (
        <>
            <Link to="/maestro/grupos" className="detalle__volver">← Mis grupos</Link>

            <section className="pagina__encabezado">
                <h1>{grupo.materiaNombre}</h1>
                <p className="pagina__bajada">
                    Grupo {grupo.grupoClave} · {grupo.periodoClave}. Se puede calificar cuando cierra la carga.
                </p>
            </section>

            {alumnos.length === 0 && (
                <section className="vacio">
                    <h2>Este grupo no tiene alumnos</h2>
                    <p className="pagina__bajada" style={{ margin: "0 auto" }}>
                        Nadie se ha inscrito, o todos se dieron de baja.
                    </p>
                </section>
            )}

            {alumnos.length > 0 && <FormularioCalificaciones grupoId={Number(grupoId)} alumnos={alumnos} />}
        </>
    );
}