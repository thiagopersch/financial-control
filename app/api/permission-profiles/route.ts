import { getPermissionProfiles } from '@/lib/queries/permission-profiles';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const profiles = await getPermissionProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching permission profiles:', error);
    return NextResponse.json({ error: 'Erro ao buscar perfis de permissão' }, { status: 500 });
  }
}
