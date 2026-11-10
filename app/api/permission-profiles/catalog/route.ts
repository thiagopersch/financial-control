import { getSession } from '@/lib/auth/session';
import { getPermissionCatalogGrouped } from '@/lib/services/permission-profiles';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const catalog = await getPermissionCatalogGrouped();
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error('Error fetching permission catalog:', error);
    return NextResponse.json({ error: 'Erro ao buscar catálogo de permissões' }, { status: 500 });
  }
}
