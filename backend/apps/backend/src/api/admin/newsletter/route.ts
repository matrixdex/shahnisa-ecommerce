import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import NewsletterModuleService from "../../../modules/newsletter/service"
import { NEWSLETTER_MODULE } from "../../../modules/newsletter"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const newsletterModuleService: NewsletterModuleService = req.scope.resolve(
    NEWSLETTER_MODULE
  )

  const subscribers = await newsletterModuleService.listSubscribers(
    {},
    { order: { created_at: "DESC" } }
  )

  res.json({ subscribers, count: subscribers.length })
}
