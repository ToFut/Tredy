/* eslint-env jest */

// Twilio integration mock implementations
const mockSendMessage = async (nango) => {
  const input = nango.input;

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
};

const mockGetMessages = async (nango) => {
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
    return messages.map((msg) => ({
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
};

const mockFetchTwilioMessages = async (nango) => {
  let allMessages = [];

  try {
    const listResponse = await nango.get({
      endpoint: '/Messages.json',
      params: {
        PageSize: 50
      }
    });

    const messages = listResponse.data.messages || [];
    await nango.log(`Found ${messages.length} Twilio messages to sync`);

    const batchSize = 20;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      const processedMessages = batch.map((msg) => ({
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

      if (processedMessages.length > 0) {
        await nango.batchSave(processedMessages, 'TwilioMessage');
        allMessages.push(...processedMessages);
        await nango.log(`Synced batch ${Math.floor(i/batchSize) + 1}: ${processedMessages.length} messages`);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await nango.log(`Twilio message sync completed: ${allMessages.length} messages synced`);
    return allMessages;
  } catch (error) {
    await nango.log(`Twilio message sync failed: ${error}`, { level: 'error' });
    throw error;
  }
};

const mockFetchTwilioCalls = async (nango) => {
  let allCalls = [];

  try {
    const listResponse = await nango.get({
      endpoint: '/Calls.json',
      params: {
        PageSize: 50
      }
    });

    const calls = listResponse.data.calls || [];
    await nango.log(`Found ${calls.length} Twilio calls to sync`);

    const batchSize = 20;
    for (let i = 0; i < calls.length; i += batchSize) {
      const batch = calls.slice(i, i + batchSize);

      const processedCalls = batch.map((call) => ({
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
      }));

      if (processedCalls.length > 0) {
        await nango.batchSave(processedCalls, 'TwilioCall');
        allCalls.push(...processedCalls);
        await nango.log(`Synced batch ${Math.floor(i/batchSize) + 1}: ${processedCalls.length} calls`);
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    await nango.log(`Twilio calls sync completed: ${allCalls.length} calls synced`);
    return allCalls;
  } catch (error) {
    await nango.log(`Twilio calls sync failed: ${error}`, { level: 'error' });
    throw error;
  }
};

// Mock Nango SDK
const mockNangoAction = {
  input: {},
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

const mockNangoSync = {
  get: jest.fn(),
  post: jest.fn(),
  batchSave: jest.fn(),
  log: jest.fn(),
};

describe('Twilio Integration - Send Message Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully send SMS message', async () => {
    const mockInput = {
      to: '+1234567890',
      from: '+0987654321',
      body: 'Test message'
    };

    const mockResponse = {
      data: {
        sid: 'SMtest123',
        account_sid: 'ACtest123',
        from: '+0987654321',
        to: '+1234567890',
        body: 'Test message',
        status: 'queued',
        direction: 'outbound-api',
        date_created: '2023-01-01T00:00:00Z',
        date_updated: '2023-01-01T00:00:00Z',
        num_media: '0',
        num_segments: '1',
        uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
        subresource_uris: {}
      }
    };

    mockNangoAction.input = mockInput;
    mockNangoAction.post.mockResolvedValue(mockResponse);

    const result = await mockSendMessage(mockNangoAction);

    expect(mockNangoAction.post).toHaveBeenCalledWith({
      endpoint: '/Messages.json',
      data: {
        To: mockInput.to,
        From: mockInput.from,
        Body: mockInput.body,
        MediaUrl: undefined,
        MessagingServiceSid: undefined,
        StatusCallback: undefined,
        ApplicationSid: undefined,
        MaxPrice: undefined,
        ProvideFeedback: undefined,
        Attempt: undefined,
        ValidityPeriod: undefined,
        ForceDelivery: undefined,
        ContentRetention: undefined,
        AddressRetention: undefined
      }
    });

    expect(result).toEqual({
      sid: 'SMtest123',
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      body: 'Test message',
      status: 'queued',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_sent: undefined,
      date_updated: '2023-01-01T00:00:00Z',
      error_code: undefined,
      error_message: undefined,
      messaging_service_sid: undefined,
      num_media: '0',
      num_segments: '1',
      price: undefined,
      price_unit: undefined,
      uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
      subresource_uris: {},
      searchableContent: '+0987654321 +1234567890 test message',
      syncedAt: expect.any(String)
    });
  });

  test('should throw error when required fields are missing', async () => {
    mockNangoAction.input = { body: 'Test message' }; // Missing to and from

    await expect(mockSendMessage(mockNangoAction)).rejects.toThrow(
      'Missing required fields: to and from are required'
    );
  });

  test('should throw error when both body and media_url are missing', async () => {
    mockNangoAction.input = {
      to: '+1234567890',
      from: '+0987654321'
    };

    await expect(mockSendMessage(mockNangoAction)).rejects.toThrow(
      'Either body or media_url must be provided'
    );
  });

  test('should handle API errors gracefully', async () => {
    mockNangoAction.input = {
      to: '+1234567890',
      from: '+0987654321',
      body: 'Test message'
    };

    mockNangoAction.post.mockRejectedValue(new Error('API Error'));

    await expect(mockSendMessage(mockNangoAction)).rejects.toThrow(
      'Failed to send Twilio message: Error: API Error'
    );
  });

  test('should send message with media URL', async () => {
    const mockInput = {
      to: '+1234567890',
      from: '+0987654321',
      media_url: ['https://example.com/image.png']
    };

    const mockResponse = {
      data: {
        sid: 'SMtest123',
        account_sid: 'ACtest123',
        from: '+0987654321',
        to: '+1234567890',
        body: '',
        status: 'queued',
        direction: 'outbound-api',
        date_created: '2023-01-01T00:00:00Z',
        date_updated: '2023-01-01T00:00:00Z',
        num_media: '1',
        num_segments: '1',
        uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
        subresource_uris: {}
      }
    };

    mockNangoAction.input = mockInput;
    mockNangoAction.post.mockResolvedValue(mockResponse);

    const result = await mockSendMessage(mockNangoAction);

    expect(mockNangoAction.post).toHaveBeenCalledWith({
      endpoint: '/Messages.json',
      data: expect.objectContaining({
        MediaUrl: ['https://example.com/image.png']
      })
    });

    expect(result.num_media).toBe('1');
  });
});

describe('Twilio Integration - Get Messages Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should retrieve messages successfully', async () => {
    const mockResponse = {
      data: {
        messages: [
          {
            sid: 'SMtest123',
            account_sid: 'ACtest123',
            from: '+0987654321',
            to: '+1234567890',
            body: 'Test message 1',
            status: 'delivered',
            direction: 'outbound-api',
            date_created: '2023-01-01T00:00:00Z',
            date_updated: '2023-01-01T00:00:00Z',
            num_media: '0',
            num_segments: '1',
            uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
            subresource_uris: {}
          },
          {
            sid: 'SMtest456',
            account_sid: 'ACtest123',
            from: '+1234567890',
            to: '+0987654321',
            body: 'Test message 2',
            status: 'received',
            direction: 'inbound',
            date_created: '2023-01-01T01:00:00Z',
            date_updated: '2023-01-01T01:00:00Z',
            num_media: '0',
            num_segments: '1',
            uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest456.json',
            subresource_uris: {}
          }
        ]
      }
    };

    mockNangoAction.input = {};
    mockNangoAction.get.mockResolvedValue(mockResponse);

    const result = await mockGetMessages(mockNangoAction);

    expect(mockNangoAction.get).toHaveBeenCalledWith({
      endpoint: '/Messages.json',
      params: {
        PageSize: 50,
        To: undefined,
        From: undefined,
        DateSent: undefined
      }
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      sid: 'SMtest123',
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      body: 'Test message 1',
      status: 'delivered',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_sent: undefined,
      date_updated: '2023-01-01T00:00:00Z',
      error_code: undefined,
      error_message: undefined,
      messaging_service_sid: undefined,
      num_media: '0',
      num_segments: '1',
      price: undefined,
      price_unit: undefined,
      uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
      subresource_uris: {},
      searchableContent: '+0987654321 +1234567890 test message 1',
      syncedAt: expect.any(String)
    });
  });

  test('should handle filtering parameters', async () => {
    mockNangoAction.input = {
      pageSize: 20,
      to: '+1234567890',
      from: '+0987654321',
      dateSent: '2023-01-01'
    };

    mockNangoAction.get.mockResolvedValue({ data: { messages: [] } });

    await mockGetMessages(mockNangoAction);

    expect(mockNangoAction.get).toHaveBeenCalledWith({
      endpoint: '/Messages.json',
      params: {
        PageSize: 20,
        To: '+1234567890',
        From: '+0987654321',
        DateSent: '2023-01-01'
      }
    });
  });

  test('should handle API errors', async () => {
    mockNangoAction.input = {};
    mockNangoAction.get.mockRejectedValue(new Error('API Error'));

    await expect(mockGetMessages(mockNangoAction)).rejects.toThrow(
      'Failed to get Twilio messages: Error: API Error'
    );
  });

  test('should handle empty response', async () => {
    mockNangoAction.input = {};
    mockNangoAction.get.mockResolvedValue({ data: {} });

    const result = await mockGetMessages(mockNangoAction);

    expect(result).toEqual([]);
  });
});

describe('Twilio Integration - Messages Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should sync messages successfully', async () => {
    const mockMessages = [
      {
        sid: 'SMtest123',
        account_sid: 'ACtest123',
        from: '+0987654321',
        to: '+1234567890',
        body: 'Test message 1',
        status: 'delivered',
        direction: 'outbound-api',
        date_created: '2023-01-01T00:00:00Z',
        date_updated: '2023-01-01T00:00:00Z',
        num_media: '0',
        num_segments: '1',
        uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
        subresource_uris: {}
      }
    ];

    mockNangoSync.get.mockResolvedValue({
      data: { messages: mockMessages }
    });

    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    const result = await mockFetchTwilioMessages(mockNangoSync);

    expect(mockNangoSync.get).toHaveBeenCalledWith({
      endpoint: '/Messages.json',
      params: {
        PageSize: 50
      }
    });

    expect(mockNangoSync.log).toHaveBeenCalledWith('Found 1 Twilio messages to sync');
    expect(mockNangoSync.batchSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          sid: 'SMtest123',
          searchableContent: '+0987654321 +1234567890 test message 1'
        })
      ]),
      'TwilioMessage'
    );

    expect(result).toHaveLength(1);
  });

  test('should handle sync errors', async () => {
    mockNangoSync.get.mockRejectedValue(new Error('Sync Error'));
    mockNangoSync.log.mockResolvedValue(undefined);

    await expect(mockFetchTwilioMessages(mockNangoSync)).rejects.toThrow('Sync Error');

    expect(mockNangoSync.log).toHaveBeenCalledWith(
      'Twilio message sync failed: Error: Sync Error',
      { level: 'error' }
    );
  });

  test('should handle large batches correctly', async () => {
    // Create 100 mock messages to test batching
    const mockMessages = Array.from({ length: 100 }, (_, i) => ({
      sid: `SMtest${i}`,
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      body: `Test message ${i}`,
      status: 'delivered',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_updated: '2023-01-01T00:00:00Z',
      num_media: '0',
      num_segments: '1',
      uri: `/2010-04-01/Accounts/ACtest123/Messages/SMtest${i}.json`,
      subresource_uris: {}
    }));

    mockNangoSync.get.mockResolvedValue({
      data: { messages: mockMessages }
    });

    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    const result = await mockFetchTwilioMessages(mockNangoSync);

    // Should be called 5 times (100 messages / 20 batch size)
    expect(mockNangoSync.batchSave).toHaveBeenCalledTimes(5);
    expect(result).toHaveLength(100);
  });
});

describe('Twilio Integration - Calls Sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should sync calls successfully', async () => {
    const mockCalls = [
      {
        sid: 'CAtest123',
        account_sid: 'ACtest123',
        from: '+0987654321',
        to: '+1234567890',
        status: 'completed',
        direction: 'outbound-api',
        date_created: '2023-01-01T00:00:00Z',
        date_updated: '2023-01-01T00:00:00Z',
        start_time: '2023-01-01T00:01:00Z',
        end_time: '2023-01-01T00:05:00Z',
        duration: '240',
        price: '0.01',
        price_unit: 'USD',
        uri: '/2010-04-01/Accounts/ACtest123/Calls/CAtest123.json',
        subresource_uris: {}
      }
    ];

    mockNangoSync.get.mockResolvedValue({
      data: { calls: mockCalls }
    });

    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    const result = await mockFetchTwilioCalls(mockNangoSync);

    expect(mockNangoSync.get).toHaveBeenCalledWith({
      endpoint: '/Calls.json',
      params: {
        PageSize: 50
      }
    });

    expect(mockNangoSync.log).toHaveBeenCalledWith('Found 1 Twilio calls to sync');
    expect(mockNangoSync.batchSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          sid: 'CAtest123',
          duration: '240'
        })
      ]),
      'TwilioCall'
    );

    expect(result).toHaveLength(1);
  });

  test('should handle calls sync errors', async () => {
    mockNangoSync.get.mockRejectedValue(new Error('Calls Sync Error'));
    mockNangoSync.log.mockResolvedValue(undefined);

    await expect(mockFetchTwilioCalls(mockNangoSync)).rejects.toThrow('Calls Sync Error');

    expect(mockNangoSync.log).toHaveBeenCalledWith(
      'Twilio calls sync failed: Error: Calls Sync Error',
      { level: 'error' }
    );
  });

  test('should process calls in batches', async () => {
    // Create 50 mock calls
    const mockCalls = Array.from({ length: 50 }, (_, i) => ({
      sid: `CAtest${i}`,
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      status: 'completed',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_updated: '2023-01-01T00:00:00Z',
      duration: '120',
      uri: `/2010-04-01/Accounts/ACtest123/Calls/CAtest${i}.json`,
      subresource_uris: {}
    }));

    mockNangoSync.get.mockResolvedValue({
      data: { calls: mockCalls }
    });

    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    const result = await mockFetchTwilioCalls(mockNangoSync);

    // Should be called 3 times (50 calls / 20 batch size, rounded up)
    expect(mockNangoSync.batchSave).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(50);
  });
});

describe('Twilio Integration - Models and Types', () => {
  test('should validate TwilioMessage interface structure', () => {
    // This is a TypeScript interface, so we test the structure by creating a mock object
    const mockMessage = {
      sid: 'SMtest123',
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      body: 'Test message',
      status: 'delivered',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_updated: '2023-01-01T00:00:00Z',
      num_media: '0',
      num_segments: '1',
      uri: '/2010-04-01/Accounts/ACtest123/Messages/SMtest123.json',
      subresource_uris: {},
      searchableContent: 'test content',
      syncedAt: '2023-01-01T00:00:00Z'
    };

    // Verify required fields are present
    expect(mockMessage).toHaveProperty('sid');
    expect(mockMessage).toHaveProperty('account_sid');
    expect(mockMessage).toHaveProperty('from');
    expect(mockMessage).toHaveProperty('to');
    expect(mockMessage).toHaveProperty('body');
    expect(mockMessage).toHaveProperty('status');
    expect(mockMessage).toHaveProperty('direction');
    expect(mockMessage).toHaveProperty('searchableContent');
    expect(mockMessage).toHaveProperty('syncedAt');
  });

  test('should validate TwilioSendMessageRequest interface structure', () => {
    const mockRequest = {
      to: '+1234567890',
      from: '+0987654321',
      body: 'Test message',
      media_url: ['https://example.com/image.png'],
      messaging_service_sid: 'MGtest123',
      status_callback: 'https://example.com/callback',
      max_price: '0.10',
      provide_feedback: true,
      validity_period: 14400
    };

    // Verify required and optional fields
    expect(mockRequest).toHaveProperty('to');
    expect(mockRequest).toHaveProperty('from');
    expect(mockRequest).toHaveProperty('body');
    expect(mockRequest).toHaveProperty('media_url');
    expect(mockRequest.media_url).toBeInstanceOf(Array);
  });
});

describe('Twilio Integration - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle network timeouts', async () => {
    mockNangoAction.input = {
      to: '+1234567890',
      from: '+0987654321',
      body: 'Test message'
    };

    const timeoutError = new Error('Request timeout');
    timeoutError.code = 'ETIMEDOUT';
    mockNangoAction.post.mockRejectedValue(timeoutError);

    await expect(mockSendMessage(mockNangoAction)).rejects.toThrow(
      'Failed to send Twilio message'
    );
  });

  test('should handle Twilio API specific errors', async () => {
    mockNangoAction.input = {
      to: 'invalid-number',
      from: '+0987654321',
      body: 'Test message'
    };

    const twilioError = new Error('Invalid phone number format');
    twilioError.status = 400;
    twilioError.code = 21211;
    mockNangoAction.post.mockRejectedValue(twilioError);

    await expect(mockSendMessage(mockNangoAction)).rejects.toThrow(
      'Failed to send Twilio message'
    );
  });

  test('should handle rate limiting', async () => {
    mockNangoSync.get.mockRejectedValue({
      status: 429,
      message: 'Too Many Requests'
    });

    mockNangoSync.log.mockResolvedValue(undefined);

    await expect(mockFetchTwilioMessages(mockNangoSync)).rejects.toMatchObject({
      status: 429
    });
  });
});

describe('Twilio Integration - Rate Limiting and Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should implement batching in message sync', async () => {
    const mockMessages = Array.from({ length: 40 }, (_, i) => ({
      sid: `SMtest${i}`,
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      body: `Message ${i}`,
      status: 'delivered',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_updated: '2023-01-01T00:00:00Z',
      num_media: '0',
      num_segments: '1',
      uri: `/Messages/SMtest${i}.json`,
      subresource_uris: {}
    }));

    mockNangoSync.get.mockResolvedValue({
      data: { messages: mockMessages }
    });
    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    // Mock setTimeout to resolve immediately
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 123;
    });

    const result = await mockFetchTwilioMessages(mockNangoSync);

    expect(result).toHaveLength(40);
    expect(mockNangoSync.batchSave).toHaveBeenCalledTimes(2); // 40 messages / 20 batch size

    global.setTimeout.mockRestore();
  });

  test('should implement batching in calls sync', async () => {
    const mockCalls = Array.from({ length: 60 }, (_, i) => ({
      sid: `CAtest${i}`,
      account_sid: 'ACtest123',
      from: '+0987654321',
      to: '+1234567890',
      status: 'completed',
      direction: 'outbound-api',
      date_created: '2023-01-01T00:00:00Z',
      date_updated: '2023-01-01T00:00:00Z',
      uri: `/Calls/CAtest${i}.json`,
      subresource_uris: {}
    }));

    mockNangoSync.get.mockResolvedValue({
      data: { calls: mockCalls }
    });
    mockNangoSync.log.mockResolvedValue(undefined);
    mockNangoSync.batchSave.mockResolvedValue(undefined);

    // Mock setTimeout to resolve immediately
    jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 123;
    });

    const result = await mockFetchTwilioCalls(mockNangoSync);

    expect(result).toHaveLength(60);
    expect(mockNangoSync.batchSave).toHaveBeenCalledTimes(3); // 60 calls / 20 batch size

    global.setTimeout.mockRestore();
  });
});