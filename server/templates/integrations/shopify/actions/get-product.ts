import type { NangoAction, GetProductInput, Product } from './models';

export default async function runAction(nango: NangoAction, input: GetProductInput): Promise<Product> {
  // Validate required fields
  if (!input.id) {
    throw new nango.ActionError({
      type: 'invalid_input',
      message: 'Product ID is required'
    });
  }

  try {
    // Get product via Shopify Admin API
    const response = await nango.get({
      endpoint: `/admin/api/2024-01/products/${input.id}.json`,
      retries: 3
    });

    const product = response.data.product;

    // Map to our Product model
    const mappedProduct: Product = {
      id: product.id,
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      status: product.status,
      variants: product.variants,
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    await nango.log(`Retrieved product: ${product.title} (ID: ${product.id})`);

    return mappedProduct;
  } catch (error: any) {
    if (error.status === 404) {
      throw new nango.ActionError({
        type: 'not_found',
        message: `Product with ID ${input.id} not found`
      });
    }

    throw new nango.ActionError({
      type: 'shopify_api_error',
      message: `Failed to get product: ${error.message}`
    });
  }
}