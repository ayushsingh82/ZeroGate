# Stellar Networks — Reference

> **Stealth402 uses Testnet for all demos and development.**

---

## Network Comparison

| Feature | Mainnet | Testnet | Futurenet |
|---------|---------|---------|-----------|
| Purpose | Production | Stable testing | Bleeding-edge features |
| Real money | Yes | No | No |
| Friendbot | No | Yes (10,000 XLM) | Yes (10,000 XLM) |
| Resets | Never | 2-4x per year | As needed (unpredictable) |
| Smart contract txs/ledger | Max 100 | 1 | 1 |
| Operations/ledger | 1,000 | 100 | 100 |

---

## Testnet — Our Network

| Property | Value |
|----------|-------|
| Passphrase | `Test SDF Network ; September 2015` |
| Network ID | `cee0302d59844d32bdca915c8203dd44b33fbb7edc19051ea37abedf28ecd472` |
| Horizon API | `https://horizon-testnet.stellar.org` |
| Stellar RPC | `https://soroban-testnet.stellar.org` |
| Friendbot | `https://friendbot.stellar.org` |
| USDC Contract | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

---

## Testnet Reset Schedule 2026
- **December 16, 2026** at 17:00 UTC

Resets clear: all accounts, trustlines, offers, smart contract data, transactions, history.
Announced 2+ weeks in advance on Stellar Dashboard.

---

## Friendbot Usage

Fund account:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"
```

Fund contract:
```bash
curl "https://friendbot.stellar.org?addr=YOUR_C_ADDRESS"
```

- Rate limited — don't spam
- Provides 10,000 fake XLM
- For multiple accounts: fund first with Friendbot, then use that account to fund others via Create Account operation

---

## Quickstart for Stealth402 Testnet Setup

```bash
# 1. Generate keypair
# Use Stellar Lab: https://lab.stellar.org/account/create

# 2. Fund with Friendbot
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"

# 3. Add USDC trustline
# Use Stellar Lab fund page — there's a button for it

# 4. Get testnet USDC
# https://faucet.circle.com — select Stellar Testnet, paste public key

# 5. Verify RPC connection
curl https://soroban-testnet.stellar.org \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

---

## SDK Network Config

```typescript
import { Networks, SorobanRpc } from "@stellar/stellar-sdk";

// Testnet
const server = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
const networkPassphrase = Networks.TESTNET;
// = "Test SDF Network ; September 2015"

// Mainnet (when ready to ship)
const server = new SorobanRpc.Server("https://mainnet.stellar.validationcloud.io/v1/YOUR_KEY");
const networkPassphrase = Networks.PUBLIC;
```

---

## Moving to Mainnet (Post-Hackathon)
1. Change network passphrase to `Public Global Stellar Network ; September 2015`
2. Point Horizon to a mainnet provider
3. Point RPC to a mainnet RPC service provider
4. Fund accounts with real XLM
5. Get mainnet USDC trustline + real USDC
6. Regenerate API keys for OpenZeppelin facilitator (mainnet endpoint)
7. Redeploy all Soroban contracts on mainnet

> For applications that don't rely on specific network state, the only required changes are network passphrase + RPC endpoint.
