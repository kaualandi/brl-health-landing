import Stripe from "stripe";
import { config } from "../config";

/** Cliente criado sob demanda (a chave pode não existir); `undefined` = pagamento não configurado. */
export const getStripe = () => (config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : undefined);
