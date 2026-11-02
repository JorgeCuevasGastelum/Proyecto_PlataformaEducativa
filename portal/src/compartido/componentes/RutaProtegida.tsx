import { Navigate, Outlet, useLocation } from "react-router";
import { useSesion } from "../../sesion/SesionContext";
import type { Rol } from "../tipos";

interface RutaProtegidaProps {
    rol: Rol;
}

export function RutaProtegida({ rol }: RutaProtegidaProps) {
    const { usuario } = useSesion();
    const ubicacion = useLocation();

    if (!usuario) {
        return <Navigate to="/entrar" replace state={{ desde: ubicacion.pathname }} />;
    }

    if (usuario.rol !== rol) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}