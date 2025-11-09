// ============================================
// LOGOS OFICIAIS LOCAIS
// SVGs e PNGs com fundo transparente
// ============================================

import mercadopagoLogo from "@/assets/logos/mercadopago.svg";
import stripeLogo from "@/assets/logos/stripe.svg";
import cieloLogo from "@/assets/logos/cielo.svg";
import picpayLogo from "@/assets/logos/picpay.svg";
import redeLogo from "@/assets/logos/rede.svg";
import stoneLogo from "@/assets/logos/stone.svg";
import iuguLogo from "@/assets/logos/iugu.svg";
import wirecardLogo from "@/assets/logos/wirecard.svg";
import safetypayLogo from "@/assets/logos/safetypay.svg";
import asaasLogo from "@/assets/logos/asaas.png";
import getnetLogo from "@/assets/logos/getnet.png";
import vindiLogo from "@/assets/logos/vindi.svg";
import efipayLogo from "@/assets/logos/efipay.svg";
import pagseguroLogo from "@/assets/logos/pagseguro.svg";
import paypalLogo from "@/assets/logos/paypal.svg";
import paguexLogo from "@/assets/logos/paguex.svg";
import pixLogo from "@/assets/logos/pix.svg";
import boletoLogo from "@/assets/logos/boleto.svg";
import pagarmeLogo from "@/assets/logos/pagarme.svg";
import ebanxLogo from "@/assets/logos/ebanx.svg";
import junoLogo from "@/assets/logos/juno.svg";
import pagbankLogo from "@/assets/logos/pagbank.svg";
import sumupLogo from "@/assets/logos/sumup.svg";
import adyenLogo from "@/assets/logos/adyen.svg";
import braintreeLogo from "@/assets/logos/braintree.svg";
import squareLogo from "@/assets/logos/square.svg";
import authorizenetLogo from "@/assets/logos/authorizenet.svg";
import twocheckoutLogo from "@/assets/logos/2checkout.svg";

// Mapeamento de slugs para logos locais
export const localGatewayLogos: Record<string, string> = {
  mercadopago: mercadopagoLogo,
  stripe: stripeLogo,
  cielo: cieloLogo,
  picpay: picpayLogo,
  rede: redeLogo,
  stone: stoneLogo,
  iugu: iuguLogo,
  wirecard: wirecardLogo,
  moip: wirecardLogo, // Wirecard/Moip são o mesmo
  safetypay: safetypayLogo,
  asaas: asaasLogo,
  getnet: getnetLogo,
  vindi: vindiLogo,
  efipay: efipayLogo,
  gerencianet: efipayLogo, // EFI Pay / Gerencianet são o mesmo
  pagseguro: pagseguroLogo,
  paypal: paypalLogo,
  paguex: paguexLogo,
  pix: pixLogo,
  boleto: boletoLogo,
  pagarme: pagarmeLogo,
  "pagar.me": pagarmeLogo, // Alias para pagar.me
  ebanx: ebanxLogo,
  juno: junoLogo,
  pagbank: pagbankLogo,
  sumup: sumupLogo,
  adyen: adyenLogo,
  braintree: braintreeLogo,
  square: squareLogo,
  authorizenet: authorizenetLogo,
  "authorize.net": authorizenetLogo, // Alias para authorize.net
  "2checkout": twocheckoutLogo,
  verifone: twocheckoutLogo, // Verifone owns 2Checkout
};

// Lista de gateways com logos oficiais locais
export const gatewaysWithLocalLogos = Object.keys(localGatewayLogos);

// Verificar se um gateway tem logo local
export const hasLocalLogo = (slug: string): boolean => {
  return slug ? gatewaysWithLocalLogos.includes(slug.toLowerCase()) : false;
};

// Obter logo local de um gateway
export const getLocalLogo = (slug: string): string | undefined => {
  return slug ? localGatewayLogos[slug.toLowerCase()] : undefined;
};
