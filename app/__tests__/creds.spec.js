const { getSecretsHandler, createSecretsHandler } = require("../controllers/credsController")

const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
}

describe('credential apis test', () => {
    test('get creds success', async () => {
        const mockRequest = {
            params: {
                app_id: "000000000000000000000001"
            },
            path: "/secrets/000000000000000000000001"
        }
        await getSecretsHandler(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            is_active: true,
            data: expect.any(Array)
        }));
    });

    test('post creds', async () => {
        const mockRequest = {
            params: {
                app_id: "000000000000000000000001",
                company_id: "1"
            },
            body: {
                "success": true,
                "app_id": "000000000000000000000001",
                "is_active": true,
                "data": [
                    {
                        "slug": "api_key",
                        "name": "Api Key",
                        "value": "pk_sbox_twdgcftzcawgg7awq5pa3pwmnaq",
                        "required": false
                    }
                ]
            }
        }
        await createSecretsHandler(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            is_active: true,
            data: expect.any(Array)
        }));
    })
});