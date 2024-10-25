const {
  getSecretsHandler,
  createSecretsHandler,
} = require('../controllers/credsController');

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};

jest.mock('../models/model', () => ({
  Secret: {
    create: jest.fn().mockResolvedValue(() => true),
    findOne: jest.fn().mockResolvedValue({
      secrets:
        '5f97e6a662f3198b8f6adf772b87020d:f6a18adea657f1b57ccfc0f1627be46c8333f167884a5320c6f636dfbe38a5e1',
    }),
  },
}));

describe('credential apis test', () => {
  test('get creds success', async () => {
    const mockRequest = {
      params: {
        app_id: '000000000000000000000001',
      },
      path: '/secrets/000000000000000000000001',
    };
    await getSecretsHandler(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        is_active: true,
        data: expect.any(Array),
      })
    );
  });

  test('post creds', async () => {
    const mockRequest = {
      params: {
        app_id: '000000000000000000000001',
        company_id: '1',
      },
      body: {
        success: true,
        app_id: '000000000000000000000001',
        is_active: true,
        data: [
          {
            slug: 'api_key',
            name: 'Api Key',
            value: 'pk_sbox_twdgcftzcawgg7awq5pa3pwmnaq',
            required: false,
          },
        ],
      },
    };
    await createSecretsHandler(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        is_active: true,
        data: expect.any(Array),
      })
    );
  });
});
