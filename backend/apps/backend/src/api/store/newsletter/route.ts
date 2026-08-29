import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import NewsletterModuleService from "../../../modules/newsletter/service"
import { NEWSLETTER_MODULE } from "../../../modules/newsletter"

type PostNewsletterBody = {
  email?: string
}

export async function POST(
  req: MedusaRequest<PostNewsletterBody>,
  res: MedusaResponse
): Promise<void> {
  const email = req.body?.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ message: "A valid email is required." })
    return
  }

  const newsletterModuleService: NewsletterModuleService = req.scope.resolve(
    NEWSLETTER_MODULE
  )

  const existing = await newsletterModuleService.listSubscribers({ email })
  if (!existing.length) {
    await newsletterModuleService.createSubscribers({ email })
  }

  res.json({ subscribed: true })
}
