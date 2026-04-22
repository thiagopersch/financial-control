import { PasswordForm } from '@/components/profiles/password-form';
import { ProfileForm } from '@/components/profiles/profile-form';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';
import { User } from 'lucide-react';
import { getServerSession } from 'next-auth';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });

  if (!user) return null;

  return (
    <div className="animate-in fade-in mx-auto max-w-2xl space-y-8 duration-700">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-indigo-100 p-4 dark:bg-indigo-900/30">
          <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e senha.</p>
        </div>
      </div>

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
