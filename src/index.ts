import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// Configuration
const RECIPIENT_ADDRESS = "0x2C175a3d31B21CFcB8C1091D1775ae59bdDca782";
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Middleware to simulate x402 Gate (simplified for deployment)
const x402Gate = (priceUsdc: number, description: string) => {
  return async (c: any, next: any) => {
    const signature = c.req.header('PAYMENT-SIGNATURE');
    
    if (!signature) {
      return c.json({
        x402Version: 2,
        resource: {
          url: c.req.url,
          description,
          mimeType: "application/json"
        },
        accepted: {
          scheme: "exact",
          network: "eip155:8453",
          amount: (priceUsdc * 1000000).toString(), // Convert to atomic units
          asset: USDC_BASE,
          payTo: RECIPIENT_ADDRESS,
          maxTimeoutSeconds: 60
        }
      }, 402);
    }
    
    // In production, we would verify the signature here with a facilitator
    await next();
  };
};

/**
 * POST /v1/audit
 * Audits Cairo 1.0 code for common vulnerabilities
 */
const AuditSchema = z.object({
  code: z.string().min(10).describe('Cairo 1.0 source code to audit')
});

app.post('/v1/audit', 
  x402Gate(0.05, "Cairo 1.0 Security Audit per request"),
  zValidator('json', AuditSchema), 
  async (c) => {
    const { code } = await c.req.valid('json');
    
    // Perform simulated audit logic
    const vulnerabilities = [];
    
    // Rule: Access Control
    if (code.includes('get_caller_address()') && !code.includes('assert') && !code.includes('check_')) {
      vulnerabilities.push({
        type: "Access Control",
        severity: "High",
        detail: "Caller address is used without accompanying assertions or validation functions."
      });
    }

    // Rule: Unprotected Upgrade
    if (code.includes('replace_class_syscall') && !code.includes('assert_only_owner') && !code.includes('only_upgrade_governor')) {
      vulnerabilities.push({
        type: "Unprotected Upgrade",
        severity: "Critical",
        detail: "Contract uses replace_class_syscall without a visible ownership/governance check."
      });
    }

    // Rule: Missing Reentrancy Protection
    if (code.includes('call_contract_syscall') && !code.includes('ReentrancyGuard')) {
      vulnerabilities.push({
        type: "Reentrancy Risk",
        severity: "Medium",
        detail: "External call detected without visible ReentrancyGuard component."
      });
    }

    return c.json({
      status: vulnerabilities.length > 0 ? "Flagged" : "Clear",
      vulnerabilities,
      timestamp: new Date().toISOString(),
      agent: "Pi (Cavos Intelligence)"
    });
});

/**
 * POST /v1/optimize
 * Provides gas optimization tips for Cairo code
 */
app.post('/v1/optimize',
  x402Gate(0.03, "Cairo Gas Optimization Analysis"),
  zValidator('json', AuditSchema),
  async (c) => {
    const { code } = await c.req.valid('json');
    
    const tips = [];
    if (code.includes('while')) {
      tips.push("Consider unrolling this loop to reduce range_check overhead.");
    }

    return c.json({
      tips,
      estimatedSavings: tips.length > 0 ? "15-20% Gas" : "N/A"
    });
});

app.get('/health', (c) => c.json({ status: 'ok', service: 'Cairo Audit API' }));

export default {
  port: 3000,
  fetch: app.fetch,
};
