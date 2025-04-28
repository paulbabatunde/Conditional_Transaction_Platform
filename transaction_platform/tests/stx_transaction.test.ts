import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation of the contract's state
let mockState = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  txCounter: 0,
  pendingTransactions: {},
  balances: {
    'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5': 10000,
    'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG': 5000
  }
};

// Mock implementation of contract functions
const contractFunctions = {
  // Create a new conditional transaction
  createConditionalTransaction(sender, recipient, amount) {
    // Check if sender has enough balance
    if (mockState.balances[sender] < amount) {
      return { error: 'ERR-INSUFFICIENT-FUNDS' };
    }
    
    const txId = mockState.txCounter;
    mockState.pendingTransactions[txId] = {
      sender,
      recipient,
      amount,
      onChainConditionMet: false,
      offChainConditionMet: false
    };
    
    mockState.txCounter++;
    return { success: true, result: txId };
  },
  
  // Set on-chain condition
  setOnChainCondition(sender, txId, conditionMet) {
    // Check if sender is admin
    if (sender !== mockState.admin) {
      return { error: 'ERR-NOT-AUTHORIZED' };
    }
    
    // Check if transaction exists
    if (!mockState.pendingTransactions[txId]) {
      return { error: 'ERR-TRANSACTION-NOT-FOUND' };
    }
    
    mockState.pendingTransactions[txId].onChainConditionMet = conditionMet;
    return { success: true };
  },
  
  // Set off-chain condition
  setOffChainCondition(sender, txId, conditionMet) {
    // Check if sender is admin
    if (sender !== mockState.admin) {
      return { error: 'ERR-NOT-AUTHORIZED' };
    }
    
    // Check if transaction exists
    if (!mockState.pendingTransactions[txId]) {
      return { error: 'ERR-TRANSACTION-NOT-FOUND' };
    }
    
    mockState.pendingTransactions[txId].offChainConditionMet = conditionMet;
    return { success: true };
  },
  
  // Execute transaction
  executeTransaction(sender, txId) {
    // Check if transaction exists
    if (!mockState.pendingTransactions[txId]) {
      return { error: 'ERR-TRANSACTION-NOT-FOUND' };
    }
    
    const tx = mockState.pendingTransactions[txId];
    
    // Check if all conditions are met
    if (!tx.onChainConditionMet || !tx.offChainConditionMet) {
      return { error: 'ERR-CONDITIONS-NOT-MET' };
    }
    
    // Execute the transaction
    mockState.balances[tx.sender] -= tx.amount;
    mockState.balances[tx.recipient] = (mockState.balances[tx.recipient] || 0) + tx.amount;
    
    // Remove the transaction from pending
    delete mockState.pendingTransactions[txId];
    
    return { success: true };
  },
  
  // Cancel transaction
  cancelTransaction(sender, txId) {
    // Check if transaction exists
    if (!mockState.pendingTransactions[txId]) {
      return { error: 'ERR-TRANSACTION-NOT-FOUND' };
    }
    
    // Check if sender is the transaction sender
    if (mockState.pendingTransactions[txId].sender !== sender) {
      return { error: 'ERR-NOT-AUTHORIZED' };
    }
    
    // Remove the transaction from pending
    delete mockState.pendingTransactions[txId];
    
    return { success: true };
  },
  
  // Get transaction
  getTransaction(txId) {
    return mockState.pendingTransactions[txId];
  }
};

describe('Conditional Transaction Contract', () => {
  // Reset mock state before each test
  beforeEach(() => {
    mockState = {
      admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      txCounter: 0,
      pendingTransactions: {},
      balances: {
        'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5': 10000,
        'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG': 5000
      }
    };
  });

  it('should create a conditional transaction', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    const result = contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    expect(result.success).toBe(true);
    expect(result.result).toBe(0); // First transaction ID should be 0
    expect(mockState.pendingTransactions[0]).toBeDefined();
    expect(mockState.pendingTransactions[0].sender).toBe(sender);
    expect(mockState.pendingTransactions[0].recipient).toBe(recipient);
    expect(mockState.pendingTransactions[0].amount).toBe(amount);
  });

  it('should not create a transaction if sender has insufficient funds', () => {
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 20000; // More than sender's balance
    
    const result = contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    expect(result.error).toBe('ERR-INSUFFICIENT-FUNDS');
  });

  it('should set on-chain condition', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Then set the on-chain condition
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const txId = 0;
    const conditionMet = true;
    
    const result = contractFunctions.setOnChainCondition(admin, txId, conditionMet);
    
    expect(result.success).toBe(true);
    expect(mockState.pendingTransactions[txId].onChainConditionMet).toBe(true);
  });

  it('should set off-chain condition', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Then set the off-chain condition
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const txId = 0;
    const conditionMet = true;
    
    const result = contractFunctions.setOffChainCondition(admin, txId, conditionMet);
    
    expect(result.success).toBe(true);
    expect(mockState.pendingTransactions[txId].offChainConditionMet).toBe(true);
  });

  it('should execute transaction when all conditions are met', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Set both conditions to true
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const txId = 0;
    
    contractFunctions.setOnChainCondition(admin, txId, true);
    contractFunctions.setOffChainCondition(admin, txId, true);
    
    // Initial balances
    const initialSenderBalance = mockState.balances[sender];
    const initialRecipientBalance = mockState.balances[recipient];
    
    // Execute the transaction
    const result = contractFunctions.executeTransaction(sender, txId);
    
    expect(result.success).toBe(true);
    expect(mockState.pendingTransactions[txId]).toBeUndefined(); // Transaction should be removed
    expect(mockState.balances[sender]).toBe(initialSenderBalance - amount);
    expect(mockState.balances[recipient]).toBe(initialRecipientBalance + amount);
  });

  it('should not execute transaction when conditions are not met', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Set only one condition to true
    const admin = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
    const txId = 0;
    
    contractFunctions.setOnChainCondition(admin, txId, true);
    contractFunctions.setOffChainCondition(admin, txId, false);
    
    // Initial balances
    const initialSenderBalance = mockState.balances[sender];
    const initialRecipientBalance = mockState.balances[recipient];
    
    // Try to execute the transaction
    const result = contractFunctions.executeTransaction(sender, txId);
    
    expect(result.error).toBe('ERR-CONDITIONS-NOT-MET');
    expect(mockState.pendingTransactions[txId]).toBeDefined(); // Transaction should still exist
    expect(mockState.balances[sender]).toBe(initialSenderBalance); // Balance should not change
    expect(mockState.balances[recipient]).toBe(initialRecipientBalance); // Balance should not change
  });

  it('should allow sender to cancel transaction', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Cancel the transaction
    const txId = 0;
    const result = contractFunctions.cancelTransaction(sender, txId);
    
    expect(result.success).toBe(true);
    expect(mockState.pendingTransactions[txId]).toBeUndefined(); // Transaction should be removed
  });

  it('should not allow non-sender to cancel transaction', () => {
    // First create a transaction
    const sender = 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5';
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    const amount = 1000;
    
    contractFunctions.createConditionalTransaction(sender, recipient, amount);
    
    // Try to cancel the transaction as recipient
    const txId = 0;
    const result = contractFunctions.cancelTransaction(recipient, txId);
    
    expect(result.error).toBe('ERR-NOT-AUTHORIZED');
    expect(mockState.pendingTransactions[txId]).toBeDefined(); // Transaction should still exist
  });
});