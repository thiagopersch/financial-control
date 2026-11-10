import { authOptions } from '@/lib/auth-options';
import { getServerSession, type Session } from 'next-auth';
import { cache } from 'react';

/**
 * Sessão do request atual, deduplicada com `React.cache`: queries, services e
 * guards chamam `getSession()` livremente e o JWT é decodificado (e as
 * permissões carregadas) uma única vez por request.
 */
export const getSession = cache((): Promise<Session | null> => getServerSession(authOptions));
