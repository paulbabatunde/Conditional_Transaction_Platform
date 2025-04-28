# Conditional Transaction Platform

A blockchain-based platform that enables transactions to execute only when specific on-chain and off-chain conditions are met. Built with Clarity smart contracts and tested with Vitest.

## 📋 Overview

The Conditional Transaction Platform provides a secure and flexible way to create transactions that only execute when predefined conditions are satisfied. This enables a wide range of use cases including escrow services, time-locked transactions, regulatory compliance checks, and multi-signature wallets.

## ✨ Features

- **Conditional Execution**: Transactions remain pending until all conditions are met
- **Dual Condition Types**:
  - On-chain conditions (blockchain state, time-based, balance-based)
  - Off-chain conditions (via oracle integration)
- **Admin Controls**: Secure condition validation by authorized entities
- **Complete Transaction Lifecycle**: Create, validate, execute, and cancel transactions
- **Comprehensive Testing**: Full test suite using Vitest

## 🛠️ Technology Stack

- **Smart Contract**: [Clarity](https://clarity-lang.org/) (Stacks blockchain language)
- **Testing Framework**: [Vitest](https://vitest.dev/)
- **Development Environment**: [Clarinet](https://github.com/hirosystems/clarinet) (Clarity development tool)

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/paulbabatunde/conditional-transaction-platform.git
cd conditional-transaction-platform