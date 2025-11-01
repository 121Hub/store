import { Tenant } from './tenant';

export type User = {
  id?: string;
  email?: string;
  tenants: Tenant[];
  platformRoles?: string[];
};
