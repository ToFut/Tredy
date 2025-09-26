import type { NangoAction, TwilioSendMessageRequest, TwilioMessage } from '../models';

/**
 * Twilio Send Message Action
 * Sends SMS message via Twilio API
 */
export default async function sendMessage(nango: NangoAction): Promise<TwilioMessage> {
  const input: TwilioSendMessageRequest = nango.input;

  // Validate required fields
  if (!input.to || !input.from) {
    throw new Error('Missing required fields: to and from are required');
  }

  if (!input.body && !input.media_url) {
    throw new Error('Either body or media_url must be provided');
  }

  try {
    const response = await nango.post({
      endpoint: '/Messages.json',
      data: {
        To: input.to,
        From: input.from,
        Body: input.body,
        MediaUrl: input.media_url,
        MessagingServiceSid: input.messaging_service_sid,
        StatusCallback: input.status_callback,
        ApplicationSid: input.application_sid,
        MaxPrice: input.max_price,
        ProvideFeedback: input.provide_feedback,
        Attempt: input.attempt,
        ValidityPeriod: input.validity_period,
        ForceDelivery: input.force_delivery,
        ContentRetention: input.content_retention,
        AddressRetention: input.address_retention
      }
    });

    const message = response.data;

    return {
      sid: message.sid,
      account_sid: message.account_sid,
      from: message.from,
      to: message.to,
      body: message.body || '',
      status: message.status,
      direction: message.direction,
      date_created: message.date_created,
      date_sent: message.date_sent,
      date_updated: message.date_updated,
      error_code: message.error_code,
      error_message: message.error_message,
      messaging_service_sid: message.messaging_service_sid,
      num_media: message.num_media,
      num_segments: message.num_segments,
      price: message.price,
      price_unit: message.price_unit,
      uri: message.uri,
      subresource_uris: message.subresource_uris || {},
      searchableContent: `${message.from} ${message.to} ${message.body || ''}`.toLowerCase(),
      syncedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`Failed to send Twilio message: ${error}`);
  }
}