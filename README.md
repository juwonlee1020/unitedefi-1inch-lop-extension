# 🌊 Sway — Strategy-Based Limit Order Configurator

**Sway** is a modular, programmable limit order configurator that gives DeFi users fine-grained control over how their orders are executed — over time or based on price.

This tool was built for a hackathon to explore creative extensions of 1inch Fusion's order framework, allowing users to construct execution strategies using TWAP, Range Limit, or Dutch Auction logic, all while referencing real-time price data from Chainlink oracles.

---

## 🚀 Features

- **Strategy Composer UI**: Users can visually define custom order logic using one of:
  - **TWAP (Time-Weighted Average Price)**: break orders into equal-sized chunks at fixed time intervals
  - **Range Limit Order**: gradually sell across a price range
  - **Dutch Auction**: decay the price over time until filled
- **Single Transition Rule**: Choose either time-based or price-based switching between strategies
- **Order Direction Support**: Supports both **buy** and **sell** orders
- **Market Price Listeners**: Optional fill prevention logic based on live Chainlink oracle data
- **MetaMask Wallet Integration**: Connect wallet, preview strategy, sign and deploy on-chain

---

## 🧱 Tech Stack

| Tech        | Purpose                                 |
|-------------|-----------------------------------------|
| **React**   | UI framework                            |
| **Next.js** | (if used) Server-side support / routing |
| **Vite**    | Lightning-fast frontend bundling        |
| **Redux Toolkit** | App state management for strategies |
| **TailwindCSS** / ShadCN | Styling + component system       |
| **Ethers.js** | Wallet connection & contract calls     |
| **1inch Fusion SDK** | Smart order placement infrastructure |
| **Chainlink Oracles** | Real-time price feeds for strategy control |
| **Solidity (TWAPCalculator etc.)** | Custom strategy logic onchain |

---

## 🎯 Use Case

Sway is designed for **power users and strategy designers** who want to:

- Automate limit order execution over time or based on price
- Choose the best strategy based on changing market conditions
- Stay fully onchain and decentralized

---

## 🧪 Example Strategies

- **Time-based:**
  - Sell 100 ETH using TWAP over 30 minutes  
  - If not filled, switch to Dutch Auction for remaining amount

- **Price-based:**
  - Sell 10 ETH:
    - If ETH < $2900 → Use Dutch Auction  
    - $2900–$3200 → Use TWAP  
    - >$3200 → Use Range Limit

---

## 📸 Screenshots

<img width="1728" height="1117" alt="Screenshot 2025-07-29 at 5 56 38 AM" src="https://github.com/user-attachments/assets/1877a462-2457-4825-a8e9-393f7d949983" />
<img width="1728" height="1117" alt="Screenshot 2025-07-29 at 5 59 02 AM" src="https://github.com/user-attachments/assets/8a1b4f92-3e8e-4000-8f9d-b659e7787a21" />
<img width="1728" height="1117" alt="Screenshot 2025-07-29 at 5 56 53 AM" src="https://github.com/user-attachments/assets/a6aa3467-0a87-40dc-9bd0-c570e2caf600" />
---
