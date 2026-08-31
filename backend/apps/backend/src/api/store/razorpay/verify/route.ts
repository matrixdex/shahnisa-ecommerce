import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import crypto from "crypto"

type VerifyBody = {
  cart_id?: string
  razorpay_payment_id?: string
  razorpay_order_id?: string
  razorpay_signature?: string
}

export async function POST(
  req: MedusaRequest<VerifyBody>,
  res: MedusaResponse
): Promise<void> {
  const { cart_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body || {}

  if (!cart_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    res.status(400).json({ message: "cart_id, razorpay_payment_id, razorpay_order_id and razorpay_signature are all required." })
    return
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET as string
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex")

  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(razorpay_signature)
  const verified =
    expectedBuf.length === actualBuf.length &&
    crypto.timingSafeEqual(expectedBuf, actualBuf)

  if (!verified) {
    res.status(400).json({ message: "Payment signature verification failed." })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    filters: { id: cart_id },
    fields: ["id", "payment_collection.payment_sessions.*"],
  })

  const cart = carts[0]
  const session = cart?.payment_collection?.payment_sessions?.find(
    (s: any) => s.provider_id === "pp_razorpay"
  )

  if (!session) {
    res.status(400).json({ message: "No Razorpay payment session found on this cart." })
    return
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
  await paymentModuleService.updatePaymentSession({
    id: session.id,
    currency_code: session.currency_code,
    amount: session.amount,
    data: {
      ...session.data,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      razorpay_verified: true,
    },
  })

  res.json({ verified: true })
}
