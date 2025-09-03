import type { NangoSync, Profile } from './models';

export default async function fetchLinkedinProfile(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/v2/userinfo',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Profile[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Profile');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} profile records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}

import type { NangoSync, Posts } from './models';

export default async function fetchLinkedinPosts(nango: NangoSync): Promise<void> {
  let totalRecords = 0;
  
  try {
    // Get records from LinkedIn API
    const response = await nango.get({
      endpoint: '/v2/ugcPosts',
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      }
    });
    
    const records: Posts[] = Array.isArray(response.data) ? response.data : [response.data];
    
    if (records.length > 0) {
      // Transform records for AnythingLLM
      const transformedRecords = records.map(record => ({
        ...record,
        _synced_at: new Date().toISOString(),
        _source: 'linkedin'
      }));
      
      await nango.batchSave(transformedRecords, 'Posts');
      totalRecords = transformedRecords.length;
    }
    
    await nango.log(`Successfully synced ${totalRecords} posts records`);
    
  } catch (error) {
    await nango.log(`Sync failed: ${error.message}`, 'error');
    throw error;
  }
}