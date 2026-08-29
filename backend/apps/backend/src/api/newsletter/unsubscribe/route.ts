import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import NewsletterModuleService from "../../../modules/newsletter/service"
import { NEWSLETTER_MODULE } from "../../../modules/newsletter"

// Deliberately NOT under /store — routes there require a publishable API
// key, which an unsubscribe link clicked straight out of an email client
// has no way to send. This path has no such requirement, so a plain
// `<a href="https://.../newsletter/unsubscribe?email=...">Unsubscribe</a>`
// in a newsletter email works with a single click.

function page(message: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Shahnisa</title>
<style>
  body {
    font-family: Georgia, 'Times New Roman', serif;
    background: #efeae0;
    color: #1e241f;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    padding: 2rem;
    text-align: center;
  }
  .card { max-width: 26rem; }
  h1 { font-size: 1.5rem; font-weight: 400; margin: 0 0 0.9rem; letter-spacing: 0.02em; }
  p { margin: 0; color: #6c7268; line-height: 1.6; }
</style>
</head>
<body>
  <div class="card">
    <h1>Shahnisa</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const email = String(req.query.email || "").trim().toLowerCase()
  res.setHeader("Content-Type", "text/html; charset=utf-8")

  if (!email) {
    res.status(400).send(page("Missing email address — nothing to unsubscribe."))
    return
  }

  const newsletterModuleService: NewsletterModuleService = req.scope.resolve(
    NEWSLETTER_MODULE
  )

  const existing = await newsletterModuleService.listSubscribers({ email })
  if (existing.length) {
    await newsletterModuleService.deleteSubscribers(existing.map((s) => s.id))
  }

  res.send(page("You've been unsubscribed. You won't receive any more emails from us."))
}
