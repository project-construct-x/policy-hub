import { Environment } from './model/environment.model';

export const environment: Environment = {
  production: false,
  backendUrl: '/api',
  useMocks: false,
  devBasicAuth: { username: 'admin', password: 'admin' },
};
