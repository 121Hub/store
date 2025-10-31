import { prisma } from '../prismaClient';

export async function generateUniqueTenantSlug(base: string) {
  let slugBase = base || 'tenant';
  let unique = slugBase;
  let i = 1;
  while (await prisma.tenant.findUnique({ where: { slug: unique } })) {
    unique = `${slugBase}-${i++}`;
  }
  return unique;
}
