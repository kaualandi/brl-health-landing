import type { Metadata } from "next";

import { AccountView } from "@/components/account/account-view";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "Minha conta — BRL Health",
};

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountView />
    </RequireAuth>
  );
}
