import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import { MedusaError } from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

type RazorpayOptions = {
  keyId: string
  keySecret: string
}

const RAZORPAY_API_URL = "https://api.razorpay.com/v1"

class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = "razorpay"
  protected options_: RazorpayOptions

  static validateOptions(options: RazorpayOptions): void {
    if (!options.keyId || !options.keySecret) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay's keyId and keySecret are required in the provider's options."
      )
    }
  }

  constructor(cradle: Record<string, unknown>, options: RazorpayOptions) {
    super(cradle, options)
    this.options_ = options
  }

  private authHeader(): string {
    return "Basic " + Buffer.from(`${this.options_.keyId}:${this.options_.keySecret}`).toString("base64")
  }

  private async request(path: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(`${RAZORPAY_API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader(),
        ...(init.headers || {}),
      },
    })
    const body = await res.json()
    if (!res.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        body?.error?.description || "Razorpay request failed."
      )
    }
    return body
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, currency_code } = input
    const paise = Math.round(Number(amount) * 100)

    if (paise < 100) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Razorpay requires a minimum amount of ₹1 (100 paise)."
      )
    }

    const order = await this.request("/orders", {
      method: "POST",
      body: JSON.stringify({
        amount: paise,
        currency: currency_code.toUpperCase(),
        payment_capture: 1,
      }),
    })

    return {
      id: order.id,
      data: {
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: this.options_.keyId,
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { data } = input
    if (data?.razorpay_verified === true && data?.razorpay_payment_id) {
      return { status: "authorized", data }
    }
    // Not yet verified by our /store/razorpay/verify route — defer rather
    // than fabricate a success. Medusa will not create an order from this.
    return { status: "pending_authorization", data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { data } = input
    if (data?.razorpay_verified === true) {
      return { status: "authorized", data }
    }
    return { status: "pending", data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // Orders are created with payment_capture: 1, so Razorpay auto-captures
    // on successful authorization — nothing further to do here.
    return { data: input.data }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Razorpay orders aren't cancelable via API — an unpaid order simply
    // expires on Razorpay's side. Nothing to reconcile here.
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Razorpay orders are immutable once created (amount can't be changed).
    // If the cart total changes materially, Medusa deletes and re-initiates
    // the session rather than mutating this one.
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { amount, data } = input
    const paymentId = data?.razorpay_payment_id as string | undefined
    if (!paymentId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing Razorpay payment id to refund.")
    }
    const refund = await this.request(`/payments/${paymentId}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount: Math.round(Number(amount) * 100) }),
    })
    return { data: { ...data, last_refund: refund } }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const paymentId = input.data?.razorpay_payment_id as string | undefined
    if (!paymentId) {
      return { data: input.data }
    }
    const payment = await this.request(`/payments/${paymentId}`)
    return { data: { ...input.data, razorpay_payment: payment } }
  }

  async getWebhookActionAndData(
    _payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    // No webhook endpoint/secret configured in this pass — confirmation
    // happens via the client-side verify route instead. See the plan notes
    // in backend/apps/backend/src/modules/razorpay for the recommended
    // follow-up (webhooks are the reliable source of truth for payments
    // that succeed after the customer's tab closes).
    return { action: "not_supported" }
  }
}

export default RazorpayProviderService
