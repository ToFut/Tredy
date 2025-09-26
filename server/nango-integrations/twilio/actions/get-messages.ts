import type { NangoAction, TwilioMessage } from '../models';

/**
 * Twilio Get Messages Action
 * Retrieves SMS messages via Twilio API
 */
export default async function getMessages(nango: NangoAction): Promise<TwilioMessage[]> {
  const input = nango.input || {};

  try {
    const response = await nango.get({
      endpoint: '/Messages.json',
      params: {
        PageSize: input.pageSize || 50,
        To: input.to,
        From: input.from,
        DateSent: input.dateSent
      }
    });

    const messages = response.data.messages || [];

    return messages.map((msg: any): TwilioMessage => ({
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
      searchableContent: `${msg.from} ${msg.to} ${msg.body || ''}`.toLowerCase(),
      syncedAt: new Date().toISOString()
    }));

  } catch (error) {
    throw new Error(`Failed to get Twilio messages: ${error}`);
  }
}