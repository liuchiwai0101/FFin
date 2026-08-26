import type { SystemRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & { id: string; systemRole: SystemRole };
  }

  interface User {
    systemRole: SystemRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    systemRole?: SystemRole;
  }
}
