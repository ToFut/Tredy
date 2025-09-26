import type { NangoSync, TwilioMessage } from '../models';

/**
 * Twilio Messages Sync Script
 * Syncs Twilio SMS messages for workspace integration
 */
export default async function fetchTwilioMessages(nango: NangoSync): Promise<TwilioMessage[]> {
  let allMessages: TwilioMessage[] = [];

  try {
    // Get list of messages from Twilio API
    const listResponse = await nango.get({
      endpoint: '/Messages.json',
      params: {
        PageSize: 50,  // Twilio uses PageSize instead of maxResults
      }
    });

    const messages = listResponse.data.messages || [];
    await nango.log(`Found ${messages.length} Twilio messages to sync`);

    // Process messages (Twilio returns full message data in list response)
    const batchSize = 20;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const processedMessages = batch.map((msg: any): TwilioMessage => {
        return {
          sid: msg.sid,
          account_sid: msg.account_sid,
          from: msg.from,
          to: msg.to,
          body: msg.body || '',
          status: msg.status,
          direction: msg.direction,
          date_created: msg.date_created,
          date_sent: msg.date_sent,
          date_updated: msg.date_updated,
          error_code: msg.error_code,
          error_message: msg.error_message,
          messaging_service_sid: msg.messaging_service_sid,
          num_media: msg.num_media,
          num_segments: msg.num_segments,
          price: msg.price,
          price_unit: msg.price_unit,
          uri: msg.uri,
          subresource_uris: msg.subresource_uris || {},
          // Add vector-searchable content
          searchableContent: `${msg.from} ${msg.to} ${msg.body || ''}`.toLowerCase(),
          syncedAt: new Date().toISOString()
        };
      });

      if (processedMessages.length > 0) {
        await nango.batchSave(processedMessages, 'TwilioMessage');
        allMessages.push(...processedMessages);
        await nango.log(`Synced batch ${Math.floor(i/batchSize) + 1}: ${processedMessages.length} messages`);
      }

      // Rate limiting - Twilio has rate limits, be conservative
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await nango.log(`Twilio message sync completed: ${allMessages.length} messages synced`);
    return allMessages;

  } catch (error) {
    await nango.log(`Twilio message sync failed: ${error}`, { level: 'error' });
    throw error;
  }
}