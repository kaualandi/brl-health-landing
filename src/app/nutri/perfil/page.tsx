import type { Metadata } from "next";

import { RequireAuth } from "@/components/auth/require-auth";
import { ProfileEditor } from "@/components/nutri/profile-editor";

export const metadata: Metadata = {
  title: "Editar perfil — BRL Nutri",
};

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileEditor />
    </RequireAuth>
  );
}
