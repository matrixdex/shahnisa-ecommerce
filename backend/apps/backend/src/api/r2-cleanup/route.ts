import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3"

/**
 * Medusa's admin dashboard only unlinks an image from a product when it's
 * removed (or the product is deleted) — it never calls the file provider to
 * delete the underlying R2 object, so removed images pile up in the bucket
 * forever. Run this manually (POST, from admin) after removing images: it
 * lists every URL any product currently references (thumbnail + gallery
 * images) and deletes whatever's in the bucket but not in that set.
 *
 * Only accounts for product-level images (images/thumbnail on `product`) —
 * this catalog doesn't use Medusa's separate per-variant image linking.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  const bucket = process.env.R2_BUCKET
  const endpoint = process.env.R2_ENDPOINT
  const publicUrl = process.env.R2_PUBLIC_URL
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!bucket || !endpoint || !publicUrl || !accessKeyId || !secretAccessKey) {
    res.status(400).json({ message: "R2 env vars are not fully configured." })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "thumbnail", "images.url"],
    pagination: { take: 1000, skip: 0 },
  })

  const publicPrefix = publicUrl.replace(/\/$/, "") + "/"
  const keyFromUrl = (url: string): string =>
    url.startsWith(publicPrefix) ? url.slice(publicPrefix.length) : url

  const referencedKeys = new Set<string>()
  for (const p of products) {
    if (p.thumbnail) referencedKeys.add(keyFromUrl(p.thumbnail))
    for (const img of p.images || []) {
      if (img?.url) referencedKeys.add(keyFromUrl(img.url))
    }
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })

  const orphanedKeys: string[] = []
  let continuationToken: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken })
    )
    for (const obj of page.Contents || []) {
      if (obj.Key && !referencedKeys.has(obj.Key)) orphanedKeys.push(obj.Key)
    }
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (continuationToken)

  if (!orphanedKeys.length) {
    logger.info("R2 orphaned-file cleanup: nothing to delete.")
    res.json({ deleted: 0 })
    return
  }

  // DeleteObjects accepts at most 1000 keys per request.
  for (let i = 0; i < orphanedKeys.length; i += 1000) {
    const batch = orphanedKeys.slice(i, i + 1000).map((Key) => ({ Key }))
    await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch, Quiet: true } }))
  }

  logger.info(`R2 orphaned-file cleanup: deleted ${orphanedKeys.length} unreferenced file(s).`)
  res.json({ deleted: orphanedKeys.length })
}
