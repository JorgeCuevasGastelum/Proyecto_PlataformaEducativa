import { Navigate } from "react-router";
import { useSesion } from "./SesionContext";
import Portada from "./Portada";

export default function Inicio() {
    const { usuario } = useSesion();

    if (!usuario) return <Portada />;
    if (usuario.rol === "alumno") return <Navigate to="/materias" replace />;
    if (usuario.rol === "maestro") return <Navigate to="/maestro/grupos" replace />;

    return <Navigate to="/sin-acceso" replace />;
}