import type { NangoAction, CreateRecordInput, Record } from './models';

export default async function runAction(nango: NangoAction, input: CreateRecordInput): Promise<Record> {
  // Validate required fields
  if (!input.baseId || !input.tableId || !input.fields) {
    throw new nango.ActionError({
      type: 'invalid_input',
      message: 'baseId, tableId, and fields are required'
    });
  }

  // Prepare record data
  const recordData = {
    records: [{
      fields: input.fields
    }]
  };

  try {
    // Create record via Airtable API
    const response = await nango.post({
      endpoint: `/${input.baseId}/${input.tableId}`,
      data: recordData,
      retries: 3
    });

    const record = response.data.records[0];

    // Map to our Record model
    const mappedRecord: Record = {
      id: record.id,
      fields: record.fields,
      createdTime: record.createdTime
    };

    await nango.log(`Created record in ${input.baseId}/${input.tableId}: ${record.id}`);

    return mappedRecord;
  } catch (error: any) {
    throw new nango.ActionError({
      type: 'airtable_api_error',
      message: `Failed to create record: ${error.message}`
    });
  }
}