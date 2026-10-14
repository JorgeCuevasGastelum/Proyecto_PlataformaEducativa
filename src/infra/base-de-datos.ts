import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { leerConfiguracion } from '../config/configuracion.js';
import { opcionesPrisma } from './cliente-prisma.js';

@Injectable()
export class BaseDeDatos extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() { super(opcionesPrisma(leerConfiguracion().databaseUrl)); }
  async onModuleInit() {
    await this.$connect();
    const mutex = await this.mutex.findUnique({ where: { id: 1 } });
    if (!mutex) throw new Error('Falta aplicar las migraciones de la base de datos.');
  }
  async onModuleDestroy() { await this.$disconnect(); }

  /** Bloqueo compartido por procesos; las reglas corren dentro de la transacción. */
  async escritura<T>(accion: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(async tx => {
      // SQL constante: ningún dato del cliente se concatena en esta consulta.
      await tx.$queryRawUnsafe('SELECT id FROM Mutex WHERE id = 1 FOR UPDATE');
      return accion(tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10000, timeout: 15000 });
  }
}
