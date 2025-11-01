import { User } from './user';
import { Tenant } from './tenant';

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  tenants: Tenant[];
  platformRoles: string[];
  currentTenant?: Tenant | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  switchTenant: (tenantId: string) => void;
};
