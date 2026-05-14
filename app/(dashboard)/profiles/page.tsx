import { PasswordForm } from '@/components/profiles/password-form';
import { ProfileForm } from '@/components/profiles/profile-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { Mail, Shield, User as UserIcon } from 'lucide-react';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    VIEWER: 'Visualizador',
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e senha.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="h-5 w-5 text-emerald-500" />
            Informações da Conta
          </CardTitle>
          <CardDescription>Seus dados de acesso e permissões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold tracking-wider uppercase">
                <Mail className="h-3 w-3" />
                E-mail
              </p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-semibold tracking-wider uppercase">
                <Shield className="h-3 w-3" />
                Função
              </p>
              <p className="font-medium">{roleLabels[user.role] || user.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileForm
        initialName={user.name || ''}
        initialBio={user.profile?.bio || ''}
        email={user.email}
        role={user.role}
      />

      <PasswordForm />
    </div>
  );
}
