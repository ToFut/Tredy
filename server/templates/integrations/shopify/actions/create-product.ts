import type { NangoAction, CreateProductInput, Product } from './models';

export default async function runAction(nango: NangoAction, input: CreateProductInput): Promise<Product> {
  // Validate required fields
  if (!input.title) {
    throw new nango.ActionError({
      type: 'invalid_input',
      message: 'Product title is required'
    });
  }

  // Prepare product data
  const productData = {
    product: {
      title: input.title,
      body_html: input.body_html,
      vendor: input.vendor,
      product_type: input.product_type,
      status: input.status || 'draft',
      variants: input.variants || [
        {
          title: 'Default Title',
          inventory_management: 'shopify',
          inventory_policy: 'deny'
        }
      ]
    }
  };

  try {
    // Create product via Shopify Admin API
    const response = await nango.post({
      endpoint: '/admin/api/2024-01/products.json',
      data: productData,
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

    await nango.log(`Created product: ${product.title} (ID: ${product.id})`);

    return mappedProduct;
  } catch (error: any) {
    throw new nango.ActionError({
      type: 'shopify_api_error',
      message: `Failed to create product: ${error.message}`
    });
  }
}