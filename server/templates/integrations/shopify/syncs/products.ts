import type { NangoSync, Product } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
  const config = {
    endpoint: '/admin/api/2024-01/products.json',
    paginate: {
      type: 'link',
      link_path_in_response_body: 'link',
      limit_name_in_request: 'limit',
      limit: 50
    },
    retries: 3
  };

  // Get last sync date for incremental sync
  const lastSyncDate = await nango.getLastSyncDate();
  if (lastSyncDate) {
    config.endpoint += `?updated_at_min=${lastSyncDate.toISOString()}`;
  }

  for await (const response of nango.paginate(config)) {
    const products = response.products || [];
    
    const mappedProducts: Product[] = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      body_html: product.body_html,
      vendor: product.vendor,
      product_type: product.product_type,
      handle: product.handle,
      status: product.status,
      variants: product.variants || [],
      created_at: product.created_at,
      updated_at: product.updated_at
    }));

    // Save products to Nango
    await nango.batchSave(mappedProducts, 'Product');
    
    // Log progress
    await nango.log(`Synced ${mappedProducts.length} products`);
  }
}