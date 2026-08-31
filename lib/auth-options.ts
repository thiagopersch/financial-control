import { loadPermissionsForUser } from '@/lib/permissions/load-permissions';
import prisma from '@/lib/prisma';
import { showError } from '@/lib/utils/toast';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          showError('Credenciais inválidas');
          throw new Error('Credenciais inválidas');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { workspace: true },
        });

        if (!user || !user.password) {
          showError('Usuário não encontrado');
          throw new Error('Usuário não encontrado');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          showError('Senha incorreta');
          throw new Error('Senha incorreta');
        }

        const { permissionProfileId, permissionProfileName, permissions } =
          await loadPermissionsForUser(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: user.workspaceId,
          permissionProfileId,
          permissionProfileName,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspaceId = user.workspaceId;
        token.permissionProfileId = user.permissionProfileId;
        token.permissionProfileName = user.permissionProfileName;
        token.permissions = user.permissions;
        return token;
      }

      // Recarrega as permissões a cada request: garante que uma troca de
      // Perfil de Permissão feita pelo admin valha para o usuário afetado na
      // próxima navegação, sem precisar deslogar.
      if (token.id) {
        const { permissionProfileId, permissionProfileName, permissions } =
          await loadPermissionsForUser(token.id as string);
        token.permissionProfileId = permissionProfileId;
        token.permissionProfileName = permissionProfileName;
        token.permissions = permissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.workspaceId = token.workspaceId as string;
        session.user.permissionProfileId = token.permissionProfileId as string | null;
        session.user.permissionProfileName = token.permissionProfileName as string | null;
        session.user.permissions = (token.permissions as string[]) ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
