import type { NangoSync, TwilioCall } from '../models';

/**
 * Twilio Calls Sync Script
 * Syncs Twilio call logs for workspace integration
 */
export default async function fetchTwilioCalls(nango: NangoSync): Promise<TwilioCall[]> {
  let allCalls: TwilioCall[] = [];

  try {
    // Get list of calls from Twilio API
    const listResponse = await nango.get({
      endpoint: '/Calls.json',
      params: {
        PageSize: 50,
      }
    });

    const calls = listResponse.data.calls || [];
    await nango.log(`Found ${calls.length} Twilio calls to sync`);

    // Process calls
    const batchSize = 20;
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);

      const processedCalls = batch.map((call: any): TwilioCall => {
        return {
          sid: call.sid,
          account_sid: call.account_sid,
          from: call.from,
          to: call.to,
          status: call.status,
          direction: call.direction,
          date_created: call.date_created,
          date_updated: call.date_updated,
          start_time: call.start_time,
          end_time: call.end_time,
          duration: call.duration,
          price: call.price,
          price_unit: call.price_unit,
          uri: call.uri,
          subresource_uris: call.subresource_uris || {}
        };
      });

      if (processedCalls.length > 0) {
        await nango.batchSave(processedCalls, 'TwilioCall');
        allCalls.push(...processedCalls);
        await nango.log(`Synced batch ${Math.floor(i/batchSize) + 1}: ${processedCalls.length} calls`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await nango.log(`Twilio calls sync completed: ${allCalls.length} calls synced`);
    return allCalls;

  } catch (error) {
    await nango.log(`Twilio calls sync failed: ${error}`, { level: 'error' });
    throw error;
  }
}