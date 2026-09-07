import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/newsletter",
    },
    {
      resolve: "./src/modules/otp",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/razorpay",
            options: {
              keyId: process.env.RAZORPAY_KEY_ID,
              keySecret: process.env.RAZORPAY_KEY_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          // Kept explicit now that this list is customized — dropping it
          // would silently disable existing email/password sign-in.
          {
            resolve: "@medusajs/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "@medusajs/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
          {
            resolve: "./src/modules/auth-otp",
            id: "otp",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-s3",
            id: "r2",
            options: {
              // Cloudflare R2 speaks the S3 API — this is the same provider
              // used for AWS S3, pointed at R2's endpoint instead.
              file_url: process.env.R2_PUBLIC_URL,
              access_key_id: process.env.R2_ACCESS_KEY_ID,
              secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
              region: "auto",
              bucket: process.env.R2_BUCKET,
              endpoint: process.env.R2_ENDPOINT,
              // R2 doesn't support S3 object ACLs — omit the ACL header
              // entirely rather than sending one R2 would reject.
              acl: false,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-sendgrid",
            id: "sendgrid",
            options: {
              channels: ["email"],
              api_key: process.env.SENDGRID_API_KEY,
              from: process.env.SENDGRID_FROM_EMAIL,
            },
          },
        ],
      },
    },
  ],
})
