import type { NangoSync, GmailMessage } from '../../models';

/**
 * Gmail Sync Script
 * Syncs Gmail messages for workspace integration
 */
export default async function fetchGmailMessages(nango: NangoSync): Promise<GmailMessage[]> {
  let allMessages: GmailMessage[] = [];
  
  try {
    // Get list of message IDs
    const listResponse = await nango.get({
      endpoint: '/gmail/v1/users/me/messages',
      params: {
        maxResults: 50,
        labelIds: 'INBOX'
      }
    });

    const messageIds = listResponse.data.messages || [];
    await nango.log(`Found ${messageIds.length} messages to sync`);

    // Fetch details for each message (batch process)
    const batchSize = 10;
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      
      const messagePromises = batch.map(async (msg: any) => {
        try {
          const response = await nango.get({
            endpoint: `/gmail/v1/users/me/messages/${msg.id}`,
            params: { format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] }
          });

          const headers = response.data.payload.headers;
          const getMessage = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

          return {
            id: msg.id,
            threadId: response.data.threadId,
            from: getMessage('From'),
            to: getMessage('To'), 
            subject: getMessage('Subject'),
            date: getMessage('Date'),
            snippet: response.data.snippet,
            labelIds: response.data.labelIds,
            sizeEstimate: response.data.sizeEstimate,
            internalDate: response.data.internalDate,
            // Add vector-searchable content
            searchableContent: `${getMessage('From')} ${getMessage('Subject')} ${response.data.snippet}`.toLowerCase(),
            syncedAt: new Date().toISOString()
          };
        } catch (error) {
          await nango.log(`Error fetching message ${msg.id}: ${error}`, { level: 'error' });
          return null;
        }
      });

      const batchResults = await Promise.all(messagePromises);
      const validMessages = batchResults.filter(msg => msg !== null) as GmailMessage[];
      
      if (validMessages.length > 0) {
        await nango.batchSave(validMessages, 'GmailMessage');
        allMessages.push(...validMessages);
        await nango.log(`Synced batch ${Math.floor(i/batchSize) + 1}: ${validMessages.length} messages`);
      }

      // Rate limiting - Gmail API allows 250 quota units per user per second
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await nango.log(`Gmail sync completed: ${allMessages.length} messages synced`);
    return allMessages;

  } catch (error) {
    await nango.log(`Gmail sync failed: ${error}`, { level: 'error' });
    throw error;
  }
}