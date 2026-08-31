import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    workspaceId: string;
    permissionProfileId: string | null;
    permissionProfileName: string | null;
    permissions: string[];
  }

  interface Session {
    user: User & {
      id: string;
      workspaceId: string;
      permissionProfileId: string | null;
      permissionProfileName: string | null;
      permissions: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    workspaceId: string;
    permissionProfileId: string | null;
    permissionProfileName: string | null;
    permissions: string[];
  }
}
