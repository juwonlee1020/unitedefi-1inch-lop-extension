# 🌊 Sway — Smarter On-Chain Execution Strategies

**Sway** is a decentralized trading application built on top of the [1inch Limit Order Protocol](https://docs.1inch.io/docs/limit-order-protocol/overview/), allowing users to configure complex, multi-phase execution strategies for trading on-chain assets.

Instead of being locked into a single execution style—like TWAP, Dutch auction, or fixed-price—Sway lets users compose strategies that evolve over time or react to market conditions, all encoded into a single smart order.

---

## 🧠 Core Concept

The heart of Sway is a modular smart contract system centered around `MultiPhaseAmountCalculator`, a custom `IAmountGetter` implementation. This contract:

- Supports chaining multiple execution phases in a single order
- Allows each phase to use a different pricing strategy (TWAP, Dutch auction, OTC)
- Selects the active phase based on **time** or **on-chain oracle data**

Each order becomes a programmable execution flow rather than a static trade.

---

## ✨ Example Use Case

A user wants to swap **10,000 DAI for WETH** using this strategy:

1. **Phase 1 (TWAP):** Over the first 20 minutes, sell small chunks to blend into the market.
2. **Phase 2 (Dutch Auction):** If not fully filled, start discounting the price to encourage fills.
3. **Phase 3 (OTC):** After 10 more minutes, sell any remaining DAI at a fixed discount to pre-approved addresses.

Each phase is defined with custom parameters and bundled into the order via `MultiPhaseAmountCalculator`.

---

## 🛠️ Tech Stack

### Smart Contracts Additions

- `MultiPhaseAmountCalculator`: Orchestrates the sequence of execution phases.
- `TWAPCalculator`: Time-weighted average price execution.
- `PrenegotiatedCalculator`: Fixed price for OTC-style fill.
These smart contracts can be found under: limit-order-protocol/contracts/extensions.
Tests for each of these smart contracts can be found under: limit-order-protocol/contracts/test.

Please refer to limit-order-protocol/contracts/test/MultiPhaseAmountCalculator.js for an example on how to configure a multi phase execution strategy using these building blocks.


### Frontend

- **React** + **Vite**
- Connects to configured blockchain using MetaMask
- Addresses of smart contracts deployed need to be configured under: limit-order-configurer-frontend/src/config/addresses.ts
- Execution configuration UI
- Real-time fill monitoring via charting panel (not implemented, mocked on frontend)
  
---
🛣️ Future Directions
Support more calculators, more oracle feeds for market-condition-based transitions (e.g., volatility-aware, time-decay-based)

Integration with wallet analytics:

“Sell 30% of my ETH holdings in 3 phases”

Submit orders to 1inch API in production

🫶 Credits
Huge thanks to the 1inch team for building a highly composable and extensible Limit Order Protocol. Sway builds on top of that foundation to empower users with smarter execution strategies on-chain.

