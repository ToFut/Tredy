import type { NangoAction, CreateRecordInput, Record } from './models';

export default async function createrecord(nango: NangoAction): Promise<Record> {
  const input = nango.input as CreateRecordInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.post({
      endpoint: '/{baseId}/{tableId}',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed create-record`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action create-record failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn create-record failed: ${error.message}`);
  }
}

import type { NangoAction, GetRecordInput, Record } from './models';

export default async function getrecord(nango: NangoAction): Promise<Record> {
  const input = nango.input as GetRecordInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.get({
      endpoint: '/{baseId}/{tableId}/{recordId}',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed get-record`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action get-record failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn get-record failed: ${error.message}`);
  }
}

import type { NangoAction, UpdateRecordInput, Record } from './models';

export default async function updaterecord(nango: NangoAction): Promise<Record> {
  const input = nango.input as UpdateRecordInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.patch({
      endpoint: '/{baseId}/{tableId}/{recordId}',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed update-record`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action update-record failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn update-record failed: ${error.message}`);
  }
}

import type { NangoAction, ListRecordsInput, RecordList } from './models';

export default async function listrecords(nango: NangoAction): Promise<RecordList> {
  const input = nango.input as ListRecordsInput;
  
  try {
    // LinkedIn API requires specific headers
    const response = await nango.get({
      endpoint: '/{baseId}/{tableId}',
      data: input,
      headers: {
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401',
        'Content-Type': 'application/json'
      }
    });
    
    await nango.log(`Successfully executed list-records`);
    
    return {
      success: true,
      data: response.data,
      id: response.data?.id
    };
    
  } catch (error) {
    await nango.log(`Action list-records failed: ${error.message}`, 'error');
    throw new Error(`LinkedIn list-records failed: ${error.message}`);
  }
}