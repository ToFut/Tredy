import type { NangoSync, Order } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
  const config = {
    endpoint: '/admin/api/2024-01/orders.json',
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
    const orders = response.orders || [];
    
    const mappedOrders: Order[] = orders.map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      email: order.email,
      total_price: order.total_price,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      created_at: order.created_at,
      updated_at: order.updated_at
    }));

    // Save orders to Nango
    await nango.batchSave(mappedOrders, 'Order');
    
    // Log progress
    await nango.log(`Synced ${mappedOrders.length} orders`);
  }
}