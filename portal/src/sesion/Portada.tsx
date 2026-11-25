import { Link } from "react-router";

// Lo que ve quien abre el portal sin haber iniciado sesión.
export default function Portada() {
    return (
        <>
            <section className="portada">
                <img src="/logo.svg" alt="" className="portada__logo" />
                <h1>Plataforma Educativa</h1>
                <p className="portada__texto">
                    El portal de alumnos y maestros. Arma tu carga académica, consulta tu horario
                    y tus calificaciones, y mantente al tanto de los avisos de control escolar.
                </p>
                <Link to="/entrar" className="boton">Entrar con mi cuenta</Link>
            </section>

            <ul className="portada__secciones">
                <li className="portada__tarjeta">
                    <h2>Alumnos</h2>
                    <p>Elige tus grupos de la oferta, revisa tus materias, tu horario de la semana y tu historial.</p>
                </li>
                <li className="portada__tarjeta">
                    <h2>Pagos</h2>
                    <p>Consulta tu estado de cuenta y paga tu inscripción antes de hacer tu carga.</p>
                </li>
                <li className="portada__tarjeta">
                    <h2>Maestros</h2>
                    <p>Ve la lista de cada uno de tus grupos y captura las calificaciones del período.</p>
                </li>
            </ul>
        </>
    );
}
