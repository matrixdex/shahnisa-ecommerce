import RazorpayProviderService from "./service"

// This registers a *provider* into Medusa's existing payment module (see
// medusa-config.ts), not a new top-level module — so it exports the
// ModuleProviderExports shape, the same one @medusajs/payment-stripe uses,
// rather than the Module(...) wrapper a standalone module (like
// ../newsletter) would use.
export default {
  services: [RazorpayProviderService],
}
