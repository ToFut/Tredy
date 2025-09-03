import type { NangoSync, Base } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
  const config = {
    endpoint: '/meta/bases',
    retries: 3
  };

  try {
    const response = await nango.get(config);
    const bases = response.data.bases || [];
    
    const mappedBases: Base[] = bases.map((base: any) => ({
      id: base.id,
      name: base.name,
      permissionLevel: base.permissionLevel
    }));

    // Save bases to Nango
    await nango.batchSave(mappedBases, 'Base');
    
    // Log progress
    await nango.log(`Synced ${mappedBases.length} bases`);
  } catch (error) {
    await nango.log(`Failed to sync bases: ${error.message}`);
    throw error;
  }
}