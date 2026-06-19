/* eslint-disable no-console */
const adminDomain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const adminVersion = process.env.SHOPIFY_ADMIN_API_VERSION || '2026-01';

if (!adminDomain || !adminToken) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN env variables.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function shopifyRequest(query, variables = {}) {
  const url = `https://${adminDomain}/admin/api/${adminVersion}/graphql.json`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shopify API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.errors) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(data.errors, null, 2)}`);
  }
  return data.data;
}

// 1. Clean up products
async function deleteExistingProducts() {
  console.log('Fetching existing products for cleanup...');
  let hasNext = true;
  let cursor = null;
  const productIds = [];

  while (hasNext) {
    const query = `#graphql
      query getProducts($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
          }
        }
      }
    `;
    const data = await shopifyRequest(query, { cursor });
    const nodes = data.products.nodes;
    productIds.push(...nodes.map(n => n.id));
    hasNext = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }

  console.log(`Found ${productIds.length} products to delete.`);
  for (const id of productIds) {
    console.log(`Deleting product: ${id}`);
    const deleteMutation = `#graphql
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
          userErrors {
            field
            message
          }
        }
      }
    `;
    const res = await shopifyRequest(deleteMutation, { input: { id } });
    const errors = res.productDelete.userErrors;
    if (errors && errors.length > 0) {
      console.warn(`Failed to delete product ${id}:`, errors);
    }
    await sleep(200); // Respect rate limiting
  }
}

// 2. Clean up collections
async function deleteExistingCollections() {
  console.log('Fetching existing collections for cleanup...');
  let hasNext = true;
  let cursor = null;
  const collectionIds = [];

  while (hasNext) {
    const query = `#graphql
      query getCollections($cursor: String) {
        collections(first: 50, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            handle
          }
        }
      }
    `;
    const data = await shopifyRequest(query, { cursor });
    const nodes = data.collections.nodes;
    // Keep 'frontpage' / 'home' collections if they are default, delete others
    for (const c of nodes) {
      if (c.handle !== 'frontpage' && c.handle !== 'home') {
        collectionIds.push(c.id);
      }
    }
    hasNext = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }

  console.log(`Found ${collectionIds.length} custom collections to delete.`);
  for (const id of collectionIds) {
    console.log(`Deleting collection: ${id}`);
    const deleteMutation = `#graphql
      mutation collectionDelete($input: CollectionDeleteInput!) {
        collectionDelete(input: $input) {
          deletedCollectionId
          userErrors {
            field
            message
          }
        }
      }
    `;
    try {
      const res = await shopifyRequest(deleteMutation, { input: { id } });
      const errors = res.collectionDelete.userErrors;
      if (errors && errors.length > 0) {
        console.warn(`Failed to delete collection ${id}:`, errors);
      }
    } catch (err) {
      console.warn(`Error deleting collection ${id}:`, err.message);
    }
    await sleep(200);
  }
}

// Define the catalog
const productCatalog = [
  // --- Category: Corturi & Echipament ---
  {
    title: "Cort Expediție StormBreaker 3",
    descriptionHtml: "<p>Cort de expediție premium conceput pentru 3 persoane, rezistent la vânturi extreme și zăpadă abundentă. Dispune de structură din duraluminiu și material impermeabil cu coloană de apă de 8000mm.</p>",
    productType: "Echipament Campare",
    vendor: "Nordic Expedition",
    tags: ["cort", "campare", "outdoor", "premium"],
    categoryName: "Corturi & Echipament",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        alt: "Cort StormBreaker 3 montat în zăpadă",
        mediaContentType: "IMAGE"
      }
    ],
    options: [], // Simple options
    variants: [
      {
        price: "3499.00",
        sku: "NE-SB3-ORANGE",
        optionValues: []
      }
    ]
  },
  {
    title: "Cort UltraLight Aero 2",
    descriptionHtml: "<p>Cort ultra-ușor pentru 2 persoane, ideal pentru drumeții rapide unde greutatea contează. Cântărește doar 1.2 kg și se montează în mai puțin de 3 minute.</p>",
    productType: "Echipament Campare",
    vendor: "Apex Trail",
    tags: ["cort", "ultralight", "campare", "hiking"],
    categoryName: "Corturi & Echipament",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
        alt: "Cort Aero 2 sub cerul înstelat",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "1899.00",
        sku: "AT-AERO2-GREEN",
        optionValues: []
      }
    ]
  },
  {
    title: "Cort Familial Dome 4",
    descriptionHtml: "<p>Cort spațios pentru 4 persoane cu două intrări și un vestibul generos pentru depozitarea bagajelor. Oferă ventilație excelentă și confort sporit pentru vacanțele în natură.</p>",
    productType: "Echipament Campare",
    vendor: "Maison Outdoor",
    tags: ["cort", "familie", "campare", "confort"],
    categoryName: "Corturi & Echipament",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80",
        alt: "Cort Dome 4 pe malul unui lac",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "2599.00",
        sku: "MO-DOME4-BLUE",
        optionValues: []
      }
    ]
  },
  {
    title: "Sac de Dormit Puf Everest -20C",
    descriptionHtml: "<p>Sac de dormit umplut cu puf de gâscă de calitate superioară (800 FP). Oferă protecție termică extremă până la -20 grade Celsius, având o formă anatomică de mumie.</p>",
    productType: "Echipament Campare",
    vendor: "Nordic Expedition",
    tags: ["sac dormit", "puf", "iarna", "expeditie"],
    categoryName: "Corturi & Echipament",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80",
        alt: "Sac de dormit Everest",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Mărime",
        values: [{ name: "Standard" }, { name: "Generos" }]
      }
    ],
    variants: [
      {
        price: "1599.00",
        sku: "NE-EV-STD",
        optionValues: [{ optionName: "Mărime", name: "Standard" }]
      },
      {
        price: "1749.00",
        sku: "NE-EV-LRG",
        optionValues: [{ optionName: "Mărime", name: "Generos" }]
      }
    ]
  },
  {
    title: "Saltea Autogonflabilă ComfortLite",
    descriptionHtml: "<p>Saltea autogonflabilă de 5cm grosime, ideală pentru izolare termică excelentă și confort maxim pe teren accidentat. Vine cu sac de transport și kit de reparație rapidă.</p>",
    productType: "Echipament Campare",
    vendor: "Maison Outdoor",
    tags: ["saltea", "izopren", "campare", "confort"],
    categoryName: "Corturi & Echipament",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
        alt: "Saltea autogonflabilă în cort",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Model",
        values: [{ name: "Single" }, { name: "Double" }]
      }
    ],
    variants: [
      {
        price: "449.00",
        sku: "MO-CL-SINGLE",
        optionValues: [{ optionName: "Model", name: "Single" }]
      },
      {
        price: "649.00",
        sku: "MO-CL-DOUBLE",
        optionValues: [{ optionName: "Model", name: "Double" }]
      }
    ]
  },

  // --- Category: Rucsacuri & Bagaje ---
  {
    title: "Rucsac Drumeție Apex 48",
    descriptionHtml: "<p>Rucsac tehnic de 48 litri cu sistem de spate ultra-ventilat AirFlow și cadru din aluminiu ușor. Ideal pentru drumeții de 2-3 zile, dotat cu husă de ploaie integrată.</p>",
    productType: "Rucsacuri",
    vendor: "Apex Trail",
    tags: ["rucsac", "drumetie", "tehnic", "airflow"],
    categoryName: "Rucsacuri & Bagaje",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
        alt: "Rucsac Apex 48 în natură",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Slate Grey" }, { name: "Canyon Orange" }]
      }
    ],
    variants: [
      {
        price: "849.00",
        sku: "AT-AP48-GREY",
        optionValues: [{ optionName: "Culoare", name: "Slate Grey" }]
      },
      {
        price: "849.00",
        sku: "AT-AP48-ORANGE",
        optionValues: [{ optionName: "Culoare", name: "Canyon Orange" }]
      }
    ]
  },
  {
    title: "Rucsac Expediție Titan 75L",
    descriptionHtml: "<p>Rucsac robust conceput pentru expediții lungi și încărcături grele. Sistemul ergonomic BioFit permite reglarea pe înălțime a bretelelor pentru distribuția optimă a greutății.</p>",
    productType: "Rucsacuri",
    vendor: "Nordic Expedition",
    tags: ["rucsac", "expeditie", "mare", "robust"],
    categoryName: "Rucsacuri & Bagaje",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80",
        alt: "Rucsac Titan 75L pregătit pentru drum",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Stealth Black" }, { name: "Dark Blue" }]
      }
    ],
    variants: [
      {
        price: "1399.00",
        sku: "NE-TI75-BLACK",
        optionValues: [{ optionName: "Culoare", name: "Stealth Black" }]
      },
      {
        price: "1399.00",
        sku: "NE-TI75-BLUE",
        optionValues: [{ optionName: "Culoare", name: "Dark Blue" }]
      }
    ]
  },
  {
    title: "Rucsac UltraLight Nomad 30",
    descriptionHtml: "<p>Rucsac minimalist de doar 600g cu o capacitate de 30 litri. Realizat din material rezistent Cordura, perfect pentru ascensiuni rapide de o zi sau ciclism montan.</p>",
    productType: "Rucsacuri",
    vendor: "Apex Trail",
    tags: ["rucsac", "ultralight", "nomad", "minimalist"],
    categoryName: "Rucsacuri & Bagaje",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
        alt: "Rucsac Nomad 30 purtat în drumeție",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Lime Green" }, { name: "Slate Grey" }]
      }
    ],
    variants: [
      {
        price: "599.00",
        sku: "AT-NM30-LIME",
        optionValues: [{ optionName: "Culoare", name: "Lime Green" }]
      },
      {
        price: "599.00",
        sku: "AT-NM30-GREY",
        optionValues: [{ optionName: "Culoare", name: "Slate Grey" }]
      }
    ]
  },
  {
    title: "Rucsac Alpinism Zenith 50",
    descriptionHtml: "<p>Rucsac tehnic de alpinism cu puncte de prindere ranforsate pentru colțari, pioleți și schiuri. Forma îngustă permite libertate totală de mișcare pe stâncă.</p>",
    productType: "Rucsacuri",
    vendor: "Nordic Expedition",
    tags: ["rucsac", "alpinism", "tehnic", "winter"],
    categoryName: "Rucsacuri & Bagaje",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1200&q=80",
        alt: "Rucsac tehnic Zenith 50",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "1099.00",
        sku: "NE-ZE50-RED",
        optionValues: []
      }
    ]
  },
  {
    title: "Geantă CargoDuffel 90",
    descriptionHtml: "<p>Geantă tip duffel extrem de rezistentă la uzură și impermeabilă, ideală pentru transportul echipamentului de expediție. Poate fi purtată și ca rucsac datorită bretelelor detașabile.</p>",
    productType: "Rucsacuri",
    vendor: "Maison Outdoor",
    tags: ["geanta", "duffel", "cargo", "bagaj"],
    categoryName: "Rucsacuri & Bagaje",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1200&q=80",
        alt: "Geantă CargoDuffel 90 galbenă",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "699.00",
        sku: "MO-CD90-YELLOW",
        optionValues: []
      }
    ]
  },

  // --- Category: Jachete & Îmbrăcăminte ---
  {
    title: "Geacă Hardshell StormShield Pro",
    descriptionHtml: "<p>Geacă tehnică hardshell impermeabilă și respirabilă cu membrană Gore-Tex de ultimă generație. Asigură protecție completă împotriva intemperiilor severe (coloană de apă 28.000mm).</p>",
    productType: "Îmbrăcăminte Tehnică",
    vendor: "Maison Outdoor",
    tags: ["geaca", "hardshell", "goretex", "impermeabil"],
    categoryName: "Jachete & Îmbrăcăminte",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1544640808-32ca72ac7f37?auto=format&fit=crop&w=1200&q=80",
        alt: "Geacă StormShield Pro în mediu montan",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Albastru Alpin" }, { name: "Verde Pădure" }, { name: "Negru Obsidian" }]
      },
      {
        name: "Mărime",
        values: [{ name: "S" }, { name: "M" }, { name: "L" }, { name: "XL" }]
      }
    ],
    variants: [
      // S
      { price: "1699.00", sku: "MO-SS-BLUE-S", optionValues: [{ optionName: "Culoare", name: "Albastru Alpin" }, { optionName: "Mărime", name: "S" }] },
      { price: "1699.00", sku: "MO-SS-GREEN-S", optionValues: [{ optionName: "Culoare", name: "Verde Pădure" }, { optionName: "Mărime", name: "S" }] },
      { price: "1699.00", sku: "MO-SS-BLACK-S", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "S" }] },
      // M
      { price: "1699.00", sku: "MO-SS-BLUE-M", optionValues: [{ optionName: "Culoare", name: "Albastru Alpin" }, { optionName: "Mărime", name: "M" }] },
      { price: "1699.00", sku: "MO-SS-GREEN-M", optionValues: [{ optionName: "Culoare", name: "Verde Pădure" }, { optionName: "Mărime", name: "M" }] },
      { price: "1699.00", sku: "MO-SS-BLACK-M", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "M" }] },
      // L
      { price: "1699.00", sku: "MO-SS-BLUE-L", optionValues: [{ optionName: "Culoare", name: "Albastru Alpin" }, { optionName: "Mărime", name: "L" }] },
      { price: "1699.00", sku: "MO-SS-GREEN-L", optionValues: [{ optionName: "Culoare", name: "Verde Pădure" }, { optionName: "Mărime", name: "L" }] },
      { price: "1699.00", sku: "MO-SS-BLACK-L", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "L" }] },
      // XL
      { price: "1699.00", sku: "MO-SS-BLUE-XL", optionValues: [{ optionName: "Culoare", name: "Albastru Alpin" }, { optionName: "Mărime", name: "XL" }] },
      { price: "1699.00", sku: "MO-SS-GREEN-XL", optionValues: [{ optionName: "Culoare", name: "Verde Pădure" }, { optionName: "Mărime", name: "XL" }] },
      { price: "1699.00", sku: "MO-SS-BLACK-XL", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "XL" }] }
    ]
  },
  {
    title: "Geacă Puf Alpine Loft 800",
    descriptionHtml: "<p>Geacă din puf de gâscă extrem de ușoară și călduroasă (800 FP). Oferă un raport excepțional greutate-căldură, compresibilitate mare pentru bagaj și tratament hidrofob exterior DWR.</p>",
    productType: "Îmbrăcăminte Tehnică",
    vendor: "Nordic Expedition",
    tags: ["geaca", "puf", "iarna", "termic"],
    categoryName: "Jachete & Îmbrăcăminte",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&w=1200&q=80",
        alt: "Geacă roșie din puf pe munte",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Roșu Incandescent" }, { name: "Negru Stins" }]
      },
      {
        name: "Mărime",
        values: [{ name: "S" }, { name: "M" }, { name: "L" }]
      }
    ],
    variants: [
      // S
      { price: "2199.00", sku: "NE-AL-RED-S", optionValues: [{ optionName: "Culoare", name: "Roșu Incandescent" }, { optionName: "Mărime", name: "S" }] },
      { price: "2199.00", sku: "NE-AL-BLACK-S", optionValues: [{ optionName: "Culoare", name: "Negru Stins" }, { optionName: "Mărime", name: "S" }] },
      // M
      { price: "2199.00", sku: "NE-AL-RED-M", optionValues: [{ optionName: "Culoare", name: "Roșu Incandescent" }, { optionName: "Mărime", name: "M" }] },
      { price: "2199.00", sku: "NE-AL-BLACK-M", optionValues: [{ optionName: "Culoare", name: "Negru Stins" }, { optionName: "Mărime", name: "M" }] },
      // L
      { price: "2199.00", sku: "NE-AL-RED-L", optionValues: [{ optionName: "Culoare", name: "Roșu Incandescent" }, { optionName: "Mărime", name: "L" }] },
      { price: "2199.00", sku: "NE-AL-BLACK-L", optionValues: [{ optionName: "Culoare", name: "Negru Stins" }, { optionName: "Mărime", name: "L" }] }
    ]
  },
  {
    title: "Pantaloni Tehnic TrailTrekker",
    descriptionHtml: "<p>Pantaloni elastici rezistenți la abraziune și vânt, perfecți pentru alpinism și trekking. Materialul 4-way stretch oferă flexibilitate totală în mișcări.</p>",
    productType: "Îmbrăcăminte Tehnică",
    vendor: "Apex Trail",
    tags: ["pantaloni", "trekking", "stretch", "windproof"],
    categoryName: "Jachete & Îmbrăcăminte",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
        alt: "Pantaloni tehnic TrailTrekker în natură",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Gri Ardezie" }, { name: "Negru Obsidian" }]
      },
      {
        name: "Mărime",
        values: [{ name: "S" }, { name: "M" }, { name: "L" }, { name: "XL" }]
      }
    ],
    variants: [
      // S
      { price: "699.00", sku: "AT-TT-GREY-S", optionValues: [{ optionName: "Culoare", name: "Gri Ardezie" }, { optionName: "Mărime", name: "S" }] },
      { price: "699.00", sku: "AT-TT-BLACK-S", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "S" }] },
      // M
      { price: "699.00", sku: "AT-TT-GREY-M", optionValues: [{ optionName: "Culoare", name: "Gri Ardezie" }, { optionName: "Mărime", name: "M" }] },
      { price: "699.00", sku: "AT-TT-BLACK-M", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "M" }] },
      // L
      { price: "699.00", sku: "AT-TT-GREY-L", optionValues: [{ optionName: "Culoare", name: "Gri Ardezie" }, { optionName: "Mărime", name: "L" }] },
      { price: "699.00", sku: "AT-TT-BLACK-L", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "L" }] },
      // XL
      { price: "699.00", sku: "AT-TT-GREY-XL", optionValues: [{ optionName: "Culoare", name: "Gri Ardezie" }, { optionName: "Mărime", name: "XL" }] },
      { price: "699.00", sku: "AT-TT-BLACK-XL", optionValues: [{ optionName: "Culoare", name: "Negru Obsidian" }, { optionName: "Mărime", name: "XL" }] }
    ]
  },
  {
    title: "Polar Termic GlacierFleece",
    descriptionHtml: "<p>Polar gros din material tehnic Polartec care captează eficient căldura corpului oferind în același timp o respirabilitate excelentă ca strat intermediar.</p>",
    productType: "Îmbrăcăminte Tehnică",
    vendor: "Maison Outdoor",
    tags: ["polar", "polartec", "termic", "fleece"],
    categoryName: "Jachete & Îmbrăcăminte",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80",
        alt: "Polar tehnic GlacierFleece",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Bleumarin" }, { name: "Gri Antracit" }]
      },
      {
        name: "Mărime",
        values: [{ name: "M" }, { name: "L" }, { name: "XL" }]
      }
    ],
    variants: [
      // M
      { price: "399.00", sku: "MO-GF-NAVY-M", optionValues: [{ optionName: "Culoare", name: "Bleumarin" }, { optionName: "Mărime", name: "M" }] },
      { price: "399.00", sku: "MO-GF-GREY-M", optionValues: [{ optionName: "Culoare", name: "Gri Antracit" }, { optionName: "Mărime", name: "M" }] },
      // L
      { price: "399.00", sku: "MO-GF-NAVY-L", optionValues: [{ optionName: "Culoare", name: "Bleumarin" }, { optionName: "Mărime", name: "L" }] },
      { price: "399.00", sku: "MO-GF-GREY-L", optionValues: [{ optionName: "Culoare", name: "Gri Antracit" }, { optionName: "Mărime", name: "L" }] },
      // XL
      { price: "399.00", sku: "MO-GF-NAVY-XL", optionValues: [{ optionName: "Culoare", name: "Bleumarin" }, { optionName: "Mărime", name: "XL" }] },
      { price: "399.00", sku: "MO-GF-GREY-XL", optionValues: [{ optionName: "Culoare", name: "Gri Antracit" }, { optionName: "Mărime", name: "XL" }] }
    ]
  },
  {
    title: "Bocanci Hiking TerraGrip Pro",
    descriptionHtml: "<p>Bocanci premium din piele Nubuck cu membrană impermeabilă Vibram și sistem de amortizare EVA. Asigură stabilitate maximă, aderență de top pe ud sau uscat și confort la drumeții lungi.</p>",
    productType: "Încălțăminte",
    vendor: "Apex Trail",
    tags: ["bocanci", "vibram", "hiking", "piele"],
    categoryName: "Jachete & Îmbrăcăminte",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=1200&q=80",
        alt: "Bocanci TerraGrip pe stâncă",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Maro Clasic" }, { name: "Negru Stealth" }]
      },
      {
        name: "Mărime",
        values: [{ name: "41" }, { name: "42" }, { name: "43" }, { name: "44" }, { name: "45" }]
      }
    ],
    variants: [
      // 41
      { price: "1199.00", sku: "AT-TG-BROWN-41", optionValues: [{ optionName: "Culoare", name: "Maro Clasic" }, { optionName: "Mărime", name: "41" }] },
      { price: "1199.00", sku: "AT-TG-BLACK-41", optionValues: [{ optionName: "Culoare", name: "Negru Stealth" }, { optionName: "Mărime", name: "41" }] },
      // 42
      { price: "1199.00", sku: "AT-TG-BROWN-42", optionValues: [{ optionName: "Culoare", name: "Maro Clasic" }, { optionName: "Mărime", name: "42" }] },
      { price: "1199.00", sku: "AT-TG-BLACK-42", optionValues: [{ optionName: "Culoare", name: "Negru Stealth" }, { optionName: "Mărime", name: "42" }] },
      // 43
      { price: "1199.00", sku: "AT-TG-BROWN-43", optionValues: [{ optionName: "Culoare", name: "Maro Clasic" }, { optionName: "Mărime", name: "43" }] },
      { price: "1199.00", sku: "AT-TG-BLACK-43", optionValues: [{ optionName: "Culoare", name: "Negru Stealth" }, { optionName: "Mărime", name: "43" }] },
      // 44
      { price: "1199.00", sku: "AT-TG-BROWN-44", optionValues: [{ optionName: "Culoare", name: "Maro Clasic" }, { optionName: "Mărime", name: "44" }] },
      { price: "1199.00", sku: "AT-TG-BLACK-44", optionValues: [{ optionName: "Culoare", name: "Negru Stealth" }, { optionName: "Mărime", name: "44" }] },
      // 45
      { price: "1199.00", sku: "AT-TG-BROWN-45", optionValues: [{ optionName: "Culoare", name: "Maro Clasic" }, { optionName: "Mărime", name: "45" }] },
      { price: "1199.00", sku: "AT-TG-BLACK-45", optionValues: [{ optionName: "Culoare", name: "Negru Stealth" }, { optionName: "Mărime", name: "45" }] }
    ]
  },

  // --- Category: Accesorii & Gadgets ---
  {
    title: "Lanternă Frontală Lumina 450",
    descriptionHtml: "<p>Lanternă frontală de mare intensitate (450 lumeni) cu acumulator reîncărcabil prin USB-C, moduri multiple de iluminare (inclusiv lumină roșie de noapte) și carcasă rezistentă la ploaie (IPX6).</p>",
    productType: "Accesorii Outdoor",
    vendor: "Apex Trail",
    tags: ["lanterna", "frontala", "led", "lumina"],
    categoryName: "Accesorii & Gadgets",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80",
        alt: "Lanternă frontală aprinsă pe capul unui alpinist",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "229.00",
        sku: "AT-L450-USB",
        optionValues: []
      }
    ]
  },
  {
    title: "Arzător Camping MicroBurn",
    descriptionHtml: "<p>Arzător pe gaz ultra-compact și puternic din titan, cu aprindere piezoelectrică integrată. Fierbe un litru de apă în mai puțin de 3.5 minute, având o greutate de doar 72 grame.</p>",
    productType: "Accesorii Outdoor",
    vendor: "Maison Outdoor",
    tags: ["arzator", "aragaz", "camping", "titan"],
    categoryName: "Accesorii & Gadgets",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80",
        alt: "Arzător montat pe butelie de gaz",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "189.00",
        sku: "MO-MB-PIEZO",
        optionValues: []
      }
    ]
  },
  {
    title: "Termos Vacuum Flask 1L",
    descriptionHtml: "<p>Termos din oțel inoxidabil cu izolație dublă în vid, capabil să mențină băuturile calde timp de 24 ore sau reci timp de 36 ore. Dop etanș, anti-scurgere, capacul putând fi folosit ca cană.</p>",
    productType: "Accesorii Outdoor",
    vendor: "Maison Outdoor",
    tags: ["termos", "lichide", "cald", "rece"],
    categoryName: "Accesorii & Gadgets",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1200&q=80",
        alt: "Termos așezat pe stâncă",
        mediaContentType: "IMAGE"
      }
    ],
    options: [
      {
        name: "Culoare",
        values: [{ name: "Argintiu" }, { name: "Negru" }]
      }
    ],
    variants: [
      {
        price: "149.00",
        sku: "MO-TF1-SILVER",
        optionValues: [{ optionName: "Culoare", name: "Argintiu" }]
      },
      {
        price: "149.00",
        sku: "MO-TF1-BLACK",
        optionValues: [{ optionName: "Culoare", name: "Negru" }]
      }
    ]
  },
  {
    title: "Briceag Multifuncțional SwissTrail",
    descriptionHtml: "<p>Briceag multifuncțional premium din oțel de înaltă rezoluție, dotat cu 14 instrumente esențiale printre care ferăstrău pentru lemn, deschizător de conserve, foarfecă și pensetă.</p>",
    productType: "Accesorii Outdoor",
    vendor: "Apex Trail",
    tags: ["briceag", "multifunctional", "swiss", "scule"],
    categoryName: "Accesorii & Gadgets",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=1200&q=80",
        alt: "Briceag SwissTrail deschis",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "329.00",
        sku: "AT-ST14-MULTITOOL",
        optionValues: []
      }
    ]
  },
  {
    title: "Filtru de Apă PureStream",
    descriptionHtml: "<p>Filtru de apă prin microfiltrare ce elimină 99.999% din bacterii și paraziți. Ideal pentru hidratare direct din râuri și izvoare, permițând filtrarea a până la 2000 litri de apă.</p>",
    productType: "Accesorii Outdoor",
    vendor: "Maison Outdoor",
    tags: ["filtru", "apa", "purestream", "supravietuire"],
    categoryName: "Accesorii & Gadgets",
    media: [
      {
        originalSource: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1200&q=80",
        alt: "Filtru de apă PureStream în uz",
        mediaContentType: "IMAGE"
      }
    ],
    options: [],
    variants: [
      {
        price: "269.00",
        sku: "MO-PS-FILTER",
        optionValues: []
      }
    ]
  }
];

function sanitizeHandle(title) {
  return title
    .toLowerCase()
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ț/g, 't')
    .replace(/ș/g, 's')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Helper to create a product and its variants
async function createProductWithVariants(p) {
  console.log(`Creating product: ${p.title}...`);

  const createMutation = `#graphql
    mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
        product {
          id
          title
          variants(first: 50) {
            nodes {
              id
              title
              selectedOptions {
                name
                value
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const productInput = {
    title: p.title,
    handle: sanitizeHandle(p.title),
    descriptionHtml: p.descriptionHtml,
    productType: p.productType,
    vendor: p.vendor,
    status: "ACTIVE",
    tags: p.tags,
    productOptions: p.options || []
  };

  const data = await shopifyRequest(createMutation, {
    product: productInput,
    media: p.media
  });

  const errors = data.productCreate.userErrors;
  if (errors && errors.length > 0) {
    throw new Error(`Failed to create base product: ${JSON.stringify(errors)}`);
  }

  const createdProduct = data.productCreate.product;
  const productId = createdProduct.id;
  const createdVariants = createdProduct.variants.nodes;

  console.log(`Base product created with ID: ${productId}. Created default variants count: ${createdVariants.length}`);

  // Now sort the variants into create and update buckets
  // Let's identify the first variant created automatically
  const autoCreatedVariant = createdVariants[0];

  const updateVariantsList = [];
  const createVariantsList = [];

  for (let i = 0; i < p.variants.length; i++) {
    const v = p.variants[i];
    if (i === 0 && autoCreatedVariant) {
      // The first variant gets updated
      updateVariantsList.push({
        id: autoCreatedVariant.id,
        price: v.price,
        inventoryItem: {
          sku: v.sku,
          tracked: false
        }
      });
    } else {
      // The others get created
      createVariantsList.push({
        price: v.price,
        optionValues: v.optionValues,
        inventoryItem: {
          sku: v.sku,
          tracked: false
        }
      });
    }
  }

  // Create additional variants
  if (createVariantsList.length > 0) {
    console.log(`Adding ${createVariantsList.length} extra variants to ${p.title}...`);
    const bulkCreateMutation = `#graphql
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const bulkRes = await shopifyRequest(bulkCreateMutation, {
      productId,
      variants: createVariantsList
    });
    const bulkErrors = bulkRes.productVariantsBulkCreate.userErrors;
    if (bulkErrors && bulkErrors.length > 0) {
      console.warn(`Warnings creating extra variants for ${p.title}:`, bulkErrors);
    }
  }

  // Update the first variant (price, sku, inventory tracked: false)
  if (updateVariantsList.length > 0) {
    console.log(`Updating default variant for ${p.title}...`);
    const bulkUpdateMutation = `#graphql
      mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          product {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const updateRes = await shopifyRequest(bulkUpdateMutation, {
      productId,
      variants: updateVariantsList
    });
    const updateErrors = updateRes.productVariantsBulkUpdate.userErrors;
    if (updateErrors && updateErrors.length > 0) {
      console.warn(`Warnings updating default variant for ${p.title}:`, updateErrors);
    }
  }

  return productId;
}

async function runSeeder() {
  try {
    console.log('=== STARTING OUTDOOR PREMIUM CATALOG SEEDING ===');

    // 1. Delete old products
    await deleteExistingProducts();
    await sleep(500);

    // 2. Delete old collections
    await deleteExistingCollections();
    await sleep(500);

    // 3. Create products & map to categories
    const createdProductIds = [];
    const categoryProductIds = {
      "Corturi & Echipament": [],
      "Rucsacuri & Bagaje": [],
      "Jachete & Îmbrăcăminte": [],
      "Accesorii & Gadgets": []
    };

    for (const p of productCatalog) {
      const pId = await createProductWithVariants(p);
      createdProductIds.push(pId);
      if (categoryProductIds[p.categoryName]) {
        categoryProductIds[p.categoryName].push(pId);
      }
      await sleep(500); // Prevent rate-limit hit
    }

    console.log('\nAll products created successfully. Now creating categories...');

    // 4. Create custom collections
    const collectionsToCreate = [
      { title: "Corturi & Echipament", description: "Corturi ultra-ușoare, de expediție și echipamente confortabile de campare.", handle: "corturi-echipament" },
      { title: "Rucsacuri & Bagaje", description: "Rucsacuri tehnice de drumeție, saci de expediție și bagaje rezistente.", handle: "rucsacuri-bagaje" },
      { title: "Jachete & Îmbrăcăminte", description: "Îmbrăcăminte tehnică impermeabilă, jachete din puf și încălțăminte de hiking.", handle: "jachete-imbracaminte" },
      { title: "Accesorii & Gadgets", description: "Lanterne frontale, arzătoare camping, bricege multifuncționale și accesorii vitale.", handle: "accesorii-gadgets" }
    ];

    for (const col of collectionsToCreate) {
      console.log(`Creating collection: ${col.title}...`);
      const createColMutation = `#graphql
        mutation collectionCreate($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection {
              id
              title
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const input = {
        title: col.title,
        descriptionHtml: `<p>${col.description}</p>`,
        handle: col.handle,
        products: categoryProductIds[col.title] || []
      };

      const data = await shopifyRequest(createColMutation, { input });
      const errors = data.collectionCreate.userErrors;
      if (errors && errors.length > 0) {
        console.warn(`Failed to create collection ${col.title}:`, errors);
      } else {
        console.log(`Created collection ${col.title} with ${input.products.length} products.`);
      }
      await sleep(300);
    }

    console.log('\n=== CATALOG SEEDING COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Seeder execution failed:', error);
    process.exit(1);
  }
}

runSeeder();
