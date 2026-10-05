/**
 * Online Payment Gateway Interface & Simulation Architecture
 * Prepared for Razorpay, Paytm, PhonePe, and Stripe terminal integrations.
 */

export interface PaymentGatewayIntent {
  orderId: string
  amount: number
  currency: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  notes?: Record<string, string>
}

export interface PaymentGatewayResult {
  success: boolean
  transactionId?: string
  authCode?: string
  gatewayResponse?: string
  error?: string
}

export interface IPaymentGatewayProvider {
  name: string
  isConfigured(): boolean
  generateUPIQr(amount: number, invoiceNumber: string): string
  initiatePayment(intent: PaymentGatewayIntent): Promise<PaymentGatewayResult>
  verifyPayment(transactionId: string): Promise<boolean>
}

class MockSalonPaymentGateway implements IPaymentGatewayProvider {
  public name = 'SALORA Unified UPI & POS Engine'

  public isConfigured(): boolean {
    return true
  }

  /**
   * Generates standard NPCI / UPI payment URI for QR generation
   * Format: upi://pay?pa={vpa}&pn={name}&am={amount}&tn={note}&cu=INR
   */
  public generateUPIQr(amount: number, invoiceNumber: string): string {
    const vpa = 'SALORA.salon@icici'
    const name = encodeURIComponent('SALORA Luxe Salon')
    const note = encodeURIComponent(`Bill ${invoiceNumber}`)
    return `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&tn=${note}&cu=INR`
  }

  /**
   * Simulates an online / card / UPI payment confirmation
   */
  public async initiatePayment(intent: PaymentGatewayIntent): Promise<PaymentGatewayResult> {
    await new Promise((res) => setTimeout(res, 500))
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase()
    return {
      success: true,
      transactionId: `TXN-${Date.now()}-${randomHex}`,
      authCode: `AUTH-${randomHex}`,
      gatewayResponse: 'APPROVED_BY_ISSUING_BANK',
    }
  }

  public async verifyPayment(transactionId: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 300))
    return Boolean(transactionId)
  }
}

export const paymentGatewayService = new MockSalonPaymentGateway()
