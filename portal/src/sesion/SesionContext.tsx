import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Sesion, Usuario } from "../compartido/tipos";
import { useMaterias } from "../materias/estado";
import * as servicio from "./servicio";

interface ValorSesion {
    usuario: Usuario | null;
    sesionTerminada: boolean;
    entrar: (correo: string, contrasena: string) => Promise<void>;
    salir: () => void;
}

const SesionContext = createContext<ValorSesion | null>(null);

function leerUsuario(): Usuario | null {
    const usuarioGuardado = localStorage.getItem("usuario");

    return usuarioGuardado ? (JSON.parse(usuarioGuardado) as Usuario) : null;
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);
    const [sesionTerminada, setSesionTerminada] = useState(false);

    function guardar(sesion: Sesion) {
        localStorage.setItem("token", sesion.token);
        localStorage.setItem("usuario", JSON.stringify(sesion.usuario));

        setSesionTerminada(false);
        setUsuario(sesion.usuario);
    }

    async function entrar(correo: string, contrasena: string) {
        guardar(await servicio.entrar(correo, contrasena));
    }

    function salir() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    }

    useEffect(() => {
        if (usuario && usuario.rol === "alumno") useMaterias.getState().cargar();
        else useMaterias.getState().vaciar();
    }, [usuario]);

    useEffect(() => {
        const alTerminar = () => {
            setUsuario(null);
            setSesionTerminada(true);
        };

        window.addEventListener("sesion-terminada", alTerminar);

        return () => window.removeEventListener("sesion-terminada", alTerminar);
    }, []);

    return (
        <SesionContext value={{ usuario, sesionTerminada, entrar, salir }}>
            {children}
        </SesionContext>
    );
}

export function useSesion() {
    const valor = useContext(SesionContext);

    if (!valor) throw new Error("useSesion() tiene que usarse dentro del componente <ProveedorSesion>");

    return valor;
}