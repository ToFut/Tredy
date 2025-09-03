import type { NangoAction, ListRecordsInput, RecordList } from './models';

export default async function runAction(nango: NangoAction, input: ListRecordsInput): Promise<RecordList> {
  // Validate required fields
  if (!input.baseId || !input.tableId) {
    throw new nango.ActionError({
      type: 'invalid_input',
      message: 'baseId and tableId are required'
    });
  }

  // Build query parameters
  const params: any = {};
  if (input.filterByFormula) {
    params.filterByFormula = input.filterByFormula;
  }
  if (input.maxRecords) {
    params.maxRecords = input.maxRecords;
  }
  if (input.sort) {
    params.sort = input.sort;
  }

  try {
    // Get records from Airtable API
    const response = await nango.get({
      endpoint: `/${input.baseId}/${input.tableId}`,
      params,
      retries: 3
    });

    const records = response.data.records || [];

    // Map records
    const mappedRecords = records.map((record: any) => ({
      id: record.id,
      fields: record.fields,
      createdTime: record.createdTime
    }));

    await nango.log(`Retrieved ${mappedRecords.length} records from ${input.baseId}/${input.tableId}`);

    return { records: mappedRecords };
  } catch (error: any) {
    throw new nango.ActionError({
      type: 'airtable_api_error',
      message: `Failed to list records: ${error.message}`
    });
  }
}