import { SetMetadata } from '@nestjs/common';
import type { Rol } from '../../dominio/entidades';

export const ROLES = 'roles';

export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);
