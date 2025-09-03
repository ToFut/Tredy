import type { NangoSync, Records } from './models';

export default async function fetchLinkedinRecords(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/{baseId}/{tableId}',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Records[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Records');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} records records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}

import type { NangoSync, Bases } from './models';

export default async function fetchLinkedinBases(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/meta/bases',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Bases[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Bases');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} bases records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}