import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import NewsletterModuleService from "../../../../modules/newsletter/service"
import { NEWSLETTER_MODULE } from "../../../../modules/newsletter"

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params

  const newsletterModuleService: NewsletterModuleService = req.scope.resolve(
    NEWSLETTER_MODULE
  )

  await newsletterModuleService.deleteSubscribers(id)

  res.json({ id, deleted: true })
}
