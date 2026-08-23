import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductTypesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"

// Dastkari Chikan catalog, transcribed from ../../../../../data/products.json
// (kept inline rather than read from disk at runtime — this script may run
// from source or from a compiled .medusa/server copy at different relative
// depths, so a literal require()'d path would be fragile).

const COLLECTIONS = [
  {
    handle: "bakhiya",
    name: "The Bakhiya Edit",
    stitch: "Bakhiya",
    description:
      "Shadow-work embroidery, stitched from the reverse so the design falls in soft silhouette on the front.",
  },
  {
    handle: "jaali",
    name: "Jaali Lattice",
    stitch: "Jaali",
    description:
      "Hand-pulled net work, opened thread by thread to let the fabric breathe.",
  },
  {
    handle: "murri-phanda",
    name: "Murri & Phanda",
    stitch: "Murri / Phanda",
    description:
      "Raised rice-grain and knot stitches, worked for texture you can feel as well as see.",
  },
  {
    handle: "taipchi",
    name: "Taipchi Outline",
    stitch: "Taipchi",
    description:
      "The foundational running stitch, used for fine outlines and everyday-wear pieces.",
  },
]

const PRODUCTS = [
  {
    id: "p01",
    slug: "safed-bakhiya-kurta",
    name: "Safed Bakhiya Kurta",
    category: "Kurtas",
    collection: "bakhiya",
    stitch: "Bakhiya",
    fabric: "Cotton Mulmul",
    price: 4250,
    compareAt: 5200,
    isNew: true,
    colors: ["Ivory", "Sage"],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 62,
    description:
      "Our signature piece: dense bakhiya shadow-work across the yoke, worked entirely from the reverse of the fabric so the motif falls in soft silhouette on the front. Cut in breathable mulmul cotton for everyday wear.",
    care: "Hand wash cold with mild detergent. Dry flat in shade. Iron on reverse over a muslin cloth.",
    artisanNote: "Hand-embroidered by artisans in Lucknow. Approx. 30 hours of bakhiya work per piece.",
  },
  {
    id: "p02",
    slug: "gulabi-jaali-anarkali",
    name: "Gulabi Jaali Anarkali",
    category: "Anarkalis",
    collection: "jaali",
    stitch: "Jaali",
    fabric: "Georgette",
    price: 7800,
    compareAt: null,
    isNew: true,
    colors: ["Blush", "Ivory"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.9,
    reviews: 41,
    description:
      "A floor-sweeping anarkali with hand-pulled jaali lattice across the bodice — thread drawn open, strand by strand, to let the fabric breathe. Finished with a delicate taipchi border.",
    care: "Dry clean only. Store folded in muslin to protect the jaali work.",
    artisanNote: "Jaali work is reserved for our most senior artisans — it takes years to learn to open the weave without tearing it.",
  },
  {
    id: "p03",
    slug: "murri-work-straight-suit",
    name: "Murri Work Straight Suit",
    category: "Suit Sets",
    collection: "murri-phanda",
    stitch: "Murri",
    fabric: "Cotton Silk",
    price: 6400,
    compareAt: 7100,
    isNew: false,
    colors: ["Mint", "Ivory", "Powder Blue"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.7,
    reviews: 88,
    description:
      "A 3-piece straight suit set with rice-grain murri knots forming the floral buta, paired with matching dupatta and straight-cut pants.",
    care: "Hand wash separately. Do not wring — press out water gently and dry flat.",
    artisanNote: "Every murri knot is tied by hand — this suit carries roughly 4,000 individual knots.",
  },
  {
    id: "p04",
    slug: "phanda-buta-saree",
    name: "Phanda Buta Saree",
    category: "Sarees",
    collection: "murri-phanda",
    stitch: "Phanda",
    fabric: "Chiffon",
    price: 9200,
    compareAt: null,
    isNew: false,
    colors: ["Ivory", "Sage"],
    sizes: ["Free Size"],
    rating: 4.9,
    reviews: 29,
    description:
      "A featherweight chiffon saree scattered with phanda knot butas, paired with a matching bakhiya-edged blouse piece.",
    care: "Dry clean recommended. Iron on low heat over a cloth.",
    artisanNote: "Comes with an unstitched blouse piece finished in matching phanda work.",
  },
  {
    id: "p05",
    slug: "taipchi-everyday-kurta",
    name: "Taipchi Everyday Kurta",
    category: "Kurtas",
    collection: "taipchi",
    stitch: "Taipchi",
    fabric: "Cotton",
    price: 2650,
    compareAt: 3100,
    isNew: false,
    colors: ["Ivory", "Blush", "Sage", "Powder Blue"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    rating: 4.6,
    reviews: 154,
    description:
      "Our most-loved everyday kurta — a fine taipchi running-stitch outline traces a simple floral border at the neckline and hem. Easy to wear, easy to care for.",
    care: "Machine washable on gentle cycle. Tumble dry low.",
    artisanNote: "Taipchi is the first stitch every chikankari artisan learns — simple, but unmistakably hand-done.",
  },
  {
    id: "p06",
    slug: "keel-kangan-palazzo-set",
    name: "Keel Kangan Palazzo Set",
    category: "Suit Sets",
    collection: "murri-phanda",
    stitch: "Keel Kangan",
    fabric: "Modal",
    price: 5900,
    compareAt: null,
    isNew: true,
    colors: ["Sage", "Ivory"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.8,
    reviews: 33,
    description:
      "A relaxed kurta and palazzo set with keel kangan's raised, caterpillar-like stitch bordering the sleeves and hem.",
    care: "Hand wash cold. Dry flat in shade.",
    artisanNote: "Keel kangan is one of the more time-intensive raised stitches, reserved for statement borders.",
  },
  {
    id: "p07",
    slug: "bakhiya-dupatta",
    name: "Bakhiya Shadow-Work Dupatta",
    category: "Dupattas",
    collection: "bakhiya",
    stitch: "Bakhiya",
    fabric: "Organza",
    price: 3400,
    compareAt: 3900,
    isNew: false,
    colors: ["Ivory", "Blush", "Sage"],
    sizes: ["Free Size"],
    rating: 4.7,
    reviews: 76,
    description:
      "A sheer organza dupatta with a continuous bakhiya border — the translucent shadow effect is most visible in this weight of fabric.",
    care: "Dry clean only.",
    artisanNote: "Organza shows bakhiya's signature 'shadow' more clearly than any other fabric we work with.",
  },
  {
    id: "p08",
    slug: "jaali-work-blouse",
    name: "Jaali Work Blouse",
    category: "Blouses",
    collection: "jaali",
    stitch: "Jaali",
    fabric: "Cotton Silk",
    price: 2900,
    compareAt: null,
    isNew: false,
    colors: ["Ivory"],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.5,
    reviews: 47,
    description:
      "A fitted blouse with a jaali lattice yoke, designed to pair with our sarees or stand alone with a simple skirt.",
    care: "Dry clean only.",
    artisanNote: "Unlined at the yoke by design, so the jaali lattice catches the light.",
  },
  {
    id: "p09",
    slug: "ghas-patti-mens-kurta",
    name: "Ghas Patti Men's Kurta",
    category: "Men's Kurtas",
    collection: "taipchi",
    stitch: "Ghas Patti",
    fabric: "Cotton",
    price: 3800,
    compareAt: 4300,
    isNew: true,
    colors: ["Ivory", "Powder Blue"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    rating: 4.8,
    reviews: 58,
    description:
      "A men's straight kurta with ghas patti's grass-leaf stitch bordering the placket, a quieter chikankari statement for everyday wear.",
    care: "Machine washable on gentle cycle.",
    artisanNote: "Ghas patti's graduated V-stitches are worked entirely on the right side of the fabric.",
  },
  {
    id: "p10",
    slug: "murri-lehenga-set",
    name: "Murri Work Lehenga Set",
    category: "Lehengas",
    collection: "murri-phanda",
    stitch: "Murri",
    fabric: "Georgette",
    price: 15500,
    compareAt: 18000,
    isNew: true,
    colors: ["Ivory", "Blush"],
    sizes: ["S", "M", "L", "XL"],
    rating: 5.0,
    reviews: 18,
    description:
      "A statement occasion lehenga with dense murri work across the bodice and a bakhiya-bordered dupatta, fully lined.",
    care: "Dry clean only. Store flat, folded in muslin.",
    artisanNote: "Our most labour-intensive piece — over 80 hours of combined murri and bakhiya work.",
  },
  {
    id: "p11",
    slug: "hool-detail-kurta",
    name: "Hool Detail Kurta",
    category: "Kurtas",
    collection: "jaali",
    stitch: "Hool",
    fabric: "Cotton Mulmul",
    price: 3200,
    compareAt: null,
    isNew: false,
    colors: ["Ivory", "Sage"],
    sizes: ["XS", "S", "M", "L", "XL"],
    rating: 4.6,
    reviews: 39,
    description:
      "Delicate hool eyelet stitches form the flower centres across a simple taipchi buta, punched and worked by hand.",
    care: "Hand wash cold. Dry flat in shade.",
    artisanNote: "Each hool eyelet is punched and bound by hand — no two are perfectly identical.",
  },
  {
    id: "p12",
    slug: "bijli-work-saree",
    name: "Bijli Work Saree",
    category: "Sarees",
    collection: "bakhiya",
    stitch: "Bijli",
    fabric: "Silk Chiffon",
    price: 11200,
    compareAt: null,
    isNew: false,
    colors: ["Ivory"],
    sizes: ["Free Size"],
    rating: 4.9,
    reviews: 22,
    description:
      "Bijli's lightning-bolt zigzag stitch borders the pallu of this silk chiffon saree, paired with an unstitched bakhiya blouse piece.",
    care: "Dry clean only.",
    artisanNote: "Bijli is among the rarer stitches still practised — few artisans still take it on.",
  },
]

function slugifySku(productId: string, color: string, size: string): string {
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "")
  return `${productId.toUpperCase()}-${clean(color)}-${clean(size)}`
}

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  const countryCode = "in"
  const currencyCode = "inr"

  logger.info("Seeding store data...")
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Dastkari Chikan",
          description: "Default sales channel for the Dastkari Chikan storefront",
        },
      ],
    },
  })

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Dastkari Chikan Storefront",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  })

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  })

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Dastkari Chikan",
          supported_currencies: [
            {
              currency_code: currencyCode,
              is_default: true,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  })

  logger.info("Seeding region data...")
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: currencyCode,
          countries: [countryCode],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  })
  const region = regionResult[0]
  logger.info("Finished seeding regions.")

  logger.info("Seeding tax regions...")
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: countryCode,
        provider_id: "tp_system",
        default_tax_rate: {
          rate: 5,
          code: "GST",
          name: "GST",
        },
      },
    ],
  })
  logger.info("Finished seeding tax regions.")

  logger.info("Seeding stock location data...")
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Dastkari Warehouse",
          address: {
            city: "Lucknow",
            country_code: "IN",
            address_1: "",
          },
        },
      ],
    },
  })
  const stockLocation = stockLocationResult[0]

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  })

  logger.info("Seeding fulfillment data...")
  // Created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfileResult[0]

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Dastkari Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "India",
        geo_zones: [
          {
            country_code: countryCode,
            type: "country",
          },
        ],
      },
    ],
  })

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  })

  const { result: shippingOptionsResult } = await createShippingOptionsWorkflow(
    container
  ).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "5-7 business days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: currencyCode,
            amount: 99,
          },
          {
            region_id: region.id,
            amount: 99,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "2-3 business days.",
          code: "express",
        },
        prices: [
          {
            currency_code: currencyCode,
            amount: 249,
          },
          {
            region_id: region.id,
            amount: 249,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  })
  const standardShippingOption = shippingOptionsResult.find(
    (o) => o.type?.code === "standard"
  )!
  logger.info("Finished seeding fulfillment data.")

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  })
  logger.info("Finished seeding stock location data.")

  logger.info("Seeding product data...")

  const { result: collectionResult } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: COLLECTIONS.map((c) => ({
        title: c.name,
        handle: c.handle,
        metadata: { stitch: c.stitch, description: c.description },
      })),
    },
  })
  const collectionByHandle = Object.fromEntries(
    collectionResult.map((c) => [c.handle, c])
  )

  const categories = [...new Set(PRODUCTS.map((p) => p.category))]
  const { result: productTypeResult } = await createProductTypesWorkflow(
    container
  ).run({
    input: {
      product_types: categories.map((value) => ({ value })),
    },
  })
  const productTypeByValue = Object.fromEntries(
    productTypeResult.map((t) => [t.value, t])
  )

  await createProductsWorkflow(container).run({
    input: {
      products: PRODUCTS.map((p) => ({
        title: p.name,
        handle: p.slug,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        type_id: productTypeByValue[p.category].id,
        collection_id: collectionByHandle[p.collection].id,
        metadata: {
          stitch: p.stitch,
          fabric: p.fabric,
          care: p.care,
          artisanNote: p.artisanNote,
          rating: p.rating,
          reviews: p.reviews,
          isNew: p.isNew,
          compareAt: p.compareAt,
          legacyId: p.id,
        },
        options: [
          { title: "Colour", values: p.colors },
          { title: "Size", values: p.sizes },
        ],
        variants: p.colors.flatMap((color) =>
          p.sizes.map((size) => ({
            title: `${color} / ${size}`,
            sku: slugifySku(p.id, color, size),
            options: { Colour: color, Size: size },
            prices: [
              {
                amount: p.price,
                currency_code: currencyCode,
              },
            ],
          }))
        ),
        sales_channels: [{ id: defaultSalesChannel.id }],
      })),
    },
  })
  logger.info("Finished seeding product data.")

  logger.info("Seeding inventory levels.")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 500,
        inventory_item_id: item.id,
      })),
    },
  })
  logger.info("Finished seeding inventory levels data.")

  logger.info("Seeding promotions...")
  await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "DASTKARI10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "items",
            allocation: "across",
            value: 10,
            currency_code: currencyCode,
          },
        },
        {
          // Free standard shipping above INR 3,500 subtotal — matches the
          // storefront's previous FREE_SHIPPING_THRESHOLD constant. Still
          // needs a `code` even though it's automatic (non-nullable column);
          // it's never surfaced to the customer since is_automatic is true.
          code: "FREESHIP3500",
          type: "standard",
          status: "active",
          is_automatic: true,
          application_method: {
            type: "percentage",
            target_type: "shipping_methods",
            allocation: "across",
            value: 100,
            currency_code: currencyCode,
            target_rules: [
              {
                attribute: "shipping_option_id",
                operator: "eq",
                values: [standardShippingOption.id],
              },
            ],
          },
          rules: [
            {
              attribute: "item_total",
              operator: "gte",
              values: ["3500"],
            },
          ],
        },
      ],
    },
  })
  logger.info("Finished seeding promotions.")

  logger.info("=== Dastkari Chikan seed summary ===")
  logger.info(`Publishable API key: ${publishableApiKey.token}`)
  logger.info(`Region ID (India / INR): ${region.id}`)
  logger.info(
    `Shipping options: ${shippingOptionsResult.map((o) => `${o.name}=${o.id}`).join(", ")}`
  )
}
