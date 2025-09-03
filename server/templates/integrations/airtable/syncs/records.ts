import type { NangoSync, Record } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
  // First, get list of accessible bases
  const basesResponse = await nango.get({
    endpoint: '/meta/bases',
    retries: 3
  });

  const bases = basesResponse.data.bases || [];

  for (const base of bases) {
    try {
      // Get tables in this base
      const tablesResponse = await nango.get({
        endpoint: `/meta/bases/${base.id}/tables`,
        retries: 3
      });

      const tables = tablesResponse.data.tables || [];

      // Sync records from each table
      for (const table of tables) {
        const config = {
          endpoint: `/${base.id}/${table.id}`,
          paginate: {
            type: 'offset',
            offset_name_in_request: 'offset',
            response_path: 'records',
            limit_name_in_request: 'pageSize',
            limit: 100
          },
          retries: 3
        };

        // Get last sync date for incremental sync
        const lastSyncDate = await nango.getLastSyncDate();
        if (lastSyncDate) {
          config.endpoint += `?filterByFormula=CREATED_TIME()>='${lastSyncDate.toISOString()}'`;
        }

        for await (const response of nango.paginate(config)) {
          const records = response.records || [];
          
          const mappedRecords: Record[] = records.map((record: any) => ({
            id: record.id,
            fields: record.fields,
            createdTime: record.createdTime,
            // Add base and table context
            baseId: base.id,
            tableName: table.name,
            baseName: base.name
          }));

          // Save records to Nango
          await nango.batchSave(mappedRecords, 'Record');
          
          // Log progress
          await nango.log(`Synced ${mappedRecords.length} records from ${base.name}/${table.name}`);
        }
      }
    } catch (error) {
      await nango.log(`Failed to sync base ${base.name}: ${error.message}`);
    }
  }
}