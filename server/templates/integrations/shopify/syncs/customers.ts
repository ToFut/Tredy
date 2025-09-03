import type { NangoSync, Customer } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
  const config = {
    endpoint: '/admin/api/2024-01/customers.json',
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
    const customers = response.customers || [];
    
    const mappedCustomers: Customer[] = customers.map((customer: any) => ({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      orders_count: customer.orders_count,
      total_spent: customer.total_spent,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }));

    // Save customers to Nango
    await nango.batchSave(mappedCustomers, 'Customer');
    
    // Log progress  
    await nango.log(`Synced ${mappedCustomers.length} customers`);
  }
}