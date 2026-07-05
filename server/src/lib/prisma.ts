import { PrismaClient } from '@prisma/client';
import { databaseUrl } from './env';

databaseUrl();
const prisma = new PrismaClient();
export default prisma;
