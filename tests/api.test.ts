import { describe, it, expect } from 'bun:test';
import server from '../src/index';

const app = { request: server.fetch };

describe('Cairo Audit API', () => {
  it('GET /health returns 200', async () => {
    const res = await app.request(new Request('http://localhost/health'));
    expect(res.status).toBe(200);
  });

  it('POST /v1/audit returns 402 without payment signature', async () => {
    const res = await app.request(new Request('http://localhost/v1/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: "fn test() { get_caller_address(); }" })
    }));
    expect(res.status).toBe(402);
    const data = await res.json();
    expect(data.accepted.payTo).toBe("0x2C175a3d31B21CFcB8C1091D1775ae59bdDca782");
  });
});
