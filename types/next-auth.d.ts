import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      email?: string;
      name?: string;
      image?: string;
      role?: string;
    };
  }

  interface User {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  }

  interface JWT {
    id?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "ADMIN" | "PADRAO";
    };
  }
}