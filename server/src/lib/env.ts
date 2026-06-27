const LOCAL_DATABASE_URL = 'postgresql://trade_user:trade_pass@localhost:5432/trade_terminal?schema=public';
const LOCAL_JWT_SECRET = 'dev-secret';

export function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required');
  process.env.DATABASE_URL = LOCAL_DATABASE_URL;
  return LOCAL_DATABASE_URL;
}

export function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required');
  return LOCAL_JWT_SECRET;
}
