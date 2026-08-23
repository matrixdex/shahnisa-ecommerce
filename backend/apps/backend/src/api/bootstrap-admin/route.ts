import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// TEMPORARY: one-time bootstrap for the first admin user on a fresh deploy
// where Render's one-off Jobs (the normal way to run `medusa user -e -p`)
// aren't available on the free plan. Mirrors exactly what that CLI command
// does (see @medusajs/medusa/dist/commands/user.js): create a `user` row via
// create-users-workflow, then link it to an already-registered auth
// identity via app_metadata.user_id.
//
// Gated by BOOTSTRAP_SECRET (a header, not a query param, so it doesn't end
// up in access logs) and requires BOOTSTRAP_ADMIN_EMAIL /
// BOOTSTRAP_AUTH_IDENTITY_ID to be set — with none of the three set this
// route always 404s. Delete this file (and those env vars) once the admin
// account exists; it's a bootstrap script, not something that should stay
// live in production.
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.BOOTSTRAP_SECRET
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL
  const authIdentityId = process.env.BOOTSTRAP_AUTH_IDENTITY_ID

  if (!secret || !email || !authIdentityId) {
    res.status(404).json({ message: "Not found" })
    return
  }
  if (req.headers["x-bootstrap-secret"] !== secret) {
    res.status(403).json({ message: "Forbidden" })
    return
  }

  const workflowEngine = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const authService = req.scope.resolve(Modules.AUTH)

  const { result: users } = await workflowEngine.run("create-users-workflow", {
    input: { users: [{ email, roles: [] }] },
  })
  const user = users[0]

  await authService.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: { user_id: user.id },
  })

  res.json({ user })
}
