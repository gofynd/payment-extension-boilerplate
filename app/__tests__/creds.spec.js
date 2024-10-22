const { getSecretsHandler } = require("../controllers/credsController")

const mockRequest = {
    params: {
        app_id: "000000000000000000000001"
    },
    path: "/secrets/000000000000000000000001"
}

const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
}

describe('credential apis test', () => {
    test('get creds success', async () => {
        await getSecretsHandler(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            is_active: true,
            data: expect.any(Array)
        }));
    });
});