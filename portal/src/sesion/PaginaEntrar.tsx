import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import { useSesion } from "./SesionContext";
import { mensajeDeError } from "../compartido/servicios/api";

export default function PaginaEntrar() {
    const { entrar, sesionTerminada } = useSesion();

    const navegar = useNavigate();

    const ubicacion = useLocation();
    const desde = (ubicacion.state as { desde?: string } | null)?.desde ?? "/";

    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");

    const [errorCorreo, setErrorCorreo] = useState("");
    const [errorContrasena, setErrorContrasena] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);

    async function enviar(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setErrorCorreo("");
        setErrorContrasena("");

        let hayErrores = false;
        if (correo.trim() === "") {
            setErrorCorreo("Escribe tu correo institucional.");
            hayErrores = true;
        } else if (!correo.includes("@")) {
            setErrorCorreo("El correo debe llevar @, por ejemplo nombre@alumnos.edu.mx.");
            hayErrores = true;
        }
        if (contrasena === "") {
            setErrorContrasena("Escribe tu contraseña.");
            hayErrores = true;
        }
        if (hayErrores) return;

        setEnviando(true);

        try {
            await entrar(correo.trim().toLowerCase(), contrasena);
            navegar(desde, { replace: true });
        } catch (error) {
            setError(mensajeDeError(error, "No se pudo iniciar sesión."));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <form className="formulario" onSubmit={enviar} noValidate>
            <h1>Entrar</h1>
            {sesionTerminada && <p className="aviso aviso--info">Tu sesión terminó. Vuelve a entrar.</p>}
            {error && <p className="aviso aviso--error">{error}</p>}

            <label className="campo">
                <span className="campo__etiqueta">Correo institucional</span>
                <input className="campo__control" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
                {errorCorreo && <p className="campo__error">{errorCorreo}</p>}
            </label>

            <label className="campo">
                <span className="campo__etiqueta">Contraseña</span>
                <input className="campo__control" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
                {errorContrasena && <p className="campo__error">{errorContrasena}</p>}
            </label>

            <button className="boton boton--ancho" type="submit" disabled={enviando}>
                {enviando ? "Entrando..." : "Entrar"}
            </button>
        </form>
    );
}