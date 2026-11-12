import { useNavigate } from "react-router";
import { useSesion } from "../../sesion/SesionContext";

export default function SinAcceso() {
    const { salir } = useSesion();
    const navegar = useNavigate();

    function cerrarSesion() {
        navegar("/entrar", { replace: true });
        salir();
    }

    return (
        <section className="vacio">
            <h1>Esta cuenta no tiene pantallas aquí</h1>
            <p className="pagina__bajada" style={{ margin: "0 auto 1.2rem" }}>
                El portal es para alumnos y maestros.
            </p>
            <button className="boton" onClick={cerrarSesion}>Salir</button>
        </section>
    );
}