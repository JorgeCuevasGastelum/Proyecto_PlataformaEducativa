import { Navigate } from "react-router";
import { useSesion } from "./SesionContext";

export default function Inicio() {
    const { usuario } = useSesion();

    if (!usuario) return <Navigate to="/entrar" replace />;
    if (usuario.rol === "alumno") return <Navigate to="/materias" replace />;
    if (usuario.rol === "maestro") return <Navigate to="/maestro/grupos" replace />;

    return <Navigate to="/sin-acceso" replace />;
}