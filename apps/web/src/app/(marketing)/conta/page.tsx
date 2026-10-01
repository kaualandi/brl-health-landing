import type { Metadata } from "next";

import { AccountView } from "@/components/account/account-view";
import { RequireAuth } from "@/components/auth/require-auth";
import { CheckoutReturnNotice } from "@/components/checkout/checkout-return-notice";

export const metadata: Metadata = {
  title: "Minha conta — BRL Health",
};

export default function AccountPage() {
  return (
    <RequireAuth>
      <CheckoutReturnNotice />
      <AccountView />
    </RequireAuth>
  );
}
