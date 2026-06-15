import {expect, test} from '@playwright/test'

test.describe('storefront smoke tests', () => {
  test('loads the homepage and primary navigation', async ({page}) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/.+/)
    await expect(
      page
        .getByRole('navigation')
        .getByRole('link', {name: 'Collections', exact: true})
    ).toBeVisible()
    await expect(page.getByRole('link', {name: 'Shopping Bag'})).toBeVisible()
  })

  test('loads the collections index', async ({page}) => {
    await page.goto('/collections')

    await expect(
      page.getByRole('heading', {name: 'Categorii', level: 1})
    ).toBeVisible()
  })

  test('renders deterministic search results from the API contract', async ({
    page,
  }) => {
    await page.route('**/api/search**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'gid://shopify/Product/test',
              handle: 'test-snowboard',
              title: 'Test Snowboard',
              description: 'A deterministic Playwright fixture.',
              featuredImage: null,
              priceRange: {
                minVariantPrice: {
                  amount: '1999.00',
                  currencyCode: 'RON',
                },
              },
            },
          ],
        }),
      })
    })

    await page.goto('/search?q=snowboard')

    await expect(
      page.getByRole('heading', {
        name: 'Search Results for “snowboard”',
        level: 1,
      })
    ).toBeVisible()
    await expect(page.getByText('Test Snowboard')).toBeVisible()
    await expect(
      page.getByRole('link', {name: 'Test Snowboard'})
    ).toHaveAttribute('href', '/products/test-snowboard')
  })

  test('hydrates wishlist items from local storage', async ({page}) => {
    await page.goto('/wishlist')
    await page.evaluate(() => {
      localStorage.setItem(
        'wishlist_items',
        JSON.stringify([
          {
            id: 'gid://shopify/Product/wishlist-test',
            handle: 'wishlist-snowboard',
            title: 'Wishlist Snowboard',
            featuredImage: null,
            priceRange: {
              minVariantPrice: {
                amount: '2499.00',
                currencyCode: 'RON',
              },
            },
          },
        ])
      )
    })
    await page.reload()

    await expect(
      page.getByRole('heading', {name: 'Lista ta de dorințe', level: 1})
    ).toBeVisible()
    await expect(page.getByText('Wishlist Snowboard')).toBeVisible()
    await page.getByRole('button', {name: 'Remove from wishlist'}).click()
    await expect(
      page.getByText('Nu ai niciun produs în lista de dorințe.')
    ).toBeVisible()
  })

  test('implements lazy cart creation and creates cart on demand', async ({page}) => {
    // 1. Mock the API cart call to return a mock cart
    await page.route('**/api/cart**', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON()
        if (payload?.action === 'create') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              cart: {
                id: 'gid://shopify/Cart/test-cart-id',
                lines: { edges: [] },
                totalQuantity: 0,
                cost: {
                  subtotalAmount: { amount: '0.00', currencyCode: 'RON' },
                  totalAmount: { amount: '0.00', currencyCode: 'RON' },
                }
              }
            }),
          })
        }
        if (payload?.action === 'add_lines') {
          const lines = payload.lines || []
          const quantity = lines[0]?.quantity || 1
          const variantId = lines[0]?.merchandiseId || 'gid://shopify/ProductVariant/default'
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              cart: {
                id: 'gid://shopify/Cart/test-cart-id',
                lines: {
                  edges: [
                    {
                      node: {
                        id: 'line-1',
                        quantity: quantity,
                        merchandise: {
                          id: variantId,
                          title: 'Test Merchandise',
                        }
                      }
                    }
                  ]
                },
                totalQuantity: quantity,
                cost: {
                  subtotalAmount: { amount: '100.00', currencyCode: 'RON' },
                  totalAmount: { amount: '100.00', currencyCode: 'RON' },
                }
              }
            }),
          })
        }
      }
      return route.continue()
    })

    // 2. Load the homepage
    await page.goto('/')

    // 3. Verify that cartId is NOT in localStorage initially
    const initialCartId = await page.evaluate(() => localStorage.getItem('cartId'))
    expect(initialCartId).toBeNull()

    // 4. Wait for the __cart helper to be attached to window
    await page.waitForFunction(() => (window as unknown as { __cart: unknown }).__cart !== undefined)

    // 5. Trigger addToCart using the exposed __cart helper
    await page.evaluate(async () => {
      await (window as unknown as { __cart: { addToCart: (id: string, qty: number) => Promise<void> } }).__cart.addToCart('gid://shopify/ProductVariant/12345', 2)
    })

    // 5. Verify that cartId is created and saved to localStorage
    const finalCartId = await page.evaluate(() => localStorage.getItem('cartId'))
    expect(finalCartId).toBe('gid://shopify/Cart/test-cart-id')
  })
})

test('protects order cancellation from anonymous requests', async ({
  request,
}) => {
  const response = await request.post('/api/orders/cancel-request', {
    data: {orderId: 'gid://shopify/Order/1'},
  })

  expect(response.status()).toBe(401)
  await expect(response.json()).resolves.toEqual({
    error: {message: 'Nu ești autentificat.'},
  })
})
