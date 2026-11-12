import { create } from "zustand";
import { mensajeDeError } from "../compartido/servicios/api";
import type { MateriaInscrita } from "../compartido/tipos";
import { traerMateriasInscritas } from "./servicio";

interface EstadoMaterias {
    lista: MateriaInscrita[];
    cargando: boolean;
    error: string | null;
    cargar: () => Promise<void>;
    vaciar: () => void;
}

export const useMaterias = create<EstadoMaterias>()((set) => ({
    lista: [],
    cargando: true,
    error: null,
    cargar: async () => {
        set({ cargando: true, error: null });
        try {
            set({ lista: await traerMateriasInscritas() });
        } catch (error) {
            set({ error: mensajeDeError(error, "No se pudieron cargar tus materias.") });
        } finally {
            set({ cargando: false });
        }
    },
    vaciar: () => set({ lista: [], cargando: false, error: null }),
}));