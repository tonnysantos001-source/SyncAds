export interface Credentials { galaxId: string; galaxHash: string; }
export interface GalaxPayTransactionPayload {
  myId: string; value: number; payday: string; payedOutsideGalaxPay: boolean;
  PaymentMethodCreditCard?: { Card: { number: string; holder: string; expiresAt: string; cvv: string }; installment: number; };
  PaymentMethodBoleto?: { instructions: string };
  PaymentMethodPix?: { value: number; myId: string };
  Customer: { myId: string; name: string; document: string; emails: string[] };
}
export interface GalaxPayTransactionResponse { id?: number; myId?: string; status?: string; value?: number; payday?: string; galaxPayId?: number; error?: boolean; message?: string; messages?: string[] }
