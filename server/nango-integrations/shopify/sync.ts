import type { NangoSync, Products } from './models';

export default async function fetchLinkedinProducts(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/products.json',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Products[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Products');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} products records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}

import type { NangoSync, Orders } from './models';

export default async function fetchLinkedinOrders(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/orders.json',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Orders[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Orders');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} orders records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}

import type { NangoSync, Customers } from './models';

export default async function fetchLinkedinCustomers(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/customers.json',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Customers[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Customers');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} customers records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}