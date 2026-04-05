import { prisma } from '@/lib/prisma'

/**
 * Enregistre une action dans le journal d'activité.
 * Ne lève jamais d'exception (silencieux en cas d'erreur).
 */
export async function logAction(
  utilisateurId: string | null | undefined,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.journalActivite.create({
      data: {
        utilisateurId: utilisateurId ?? null,
        action,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (details ?? null) as any,
      },
    })
  } catch {
    // Ne jamais bloquer l'action principale à cause du logging
  }
}
