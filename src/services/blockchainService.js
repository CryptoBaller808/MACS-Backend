const { ethers } = require('ethers');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const logger = require('../utils/logger');

class BlockchainService {
  constructor() {
    // Polygon configuration
    this.polygonProvider = new ethers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
    );
    
    // Solana configuration
    this.solanaConnection = new Connection(
      process.env.SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
      'confirmed'
    );

    // Contract addresses
    this.macsTokenPolygon = process.env.MACS_TOKEN_POLYGON_ADDRESS;
    this.macsTokenSolana = process.env.MACS_TOKEN_SOLANA_ADDRESS;
    this.bridgeContractPolygon = process.env.BRIDGE_CONTRACT_POLYGON_ADDRESS;

    // Contract ABIs (simplified for example)
    this.macsTokenABI = [
      "function balanceOf(address owner) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function approve(address spender, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function decimals() view returns (uint8)",
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];

    this.bridgeABI = [
      "function bridgeTokens(uint256 amount, uint16 targetChain, bytes32 recipient) payable",
      "function completeBridge(bytes memory encodedVm) returns (bool)",
      "function getBridgeFee(uint16 targetChain) view returns (uint256)",
      "event TokensBridged(address indexed sender, uint256 amount, uint16 targetChain, bytes32 recipient)"
    ];
  }

  // Polygon blockchain methods
  async getPolygonBalance(walletAddress) {
    try {
      if (!ethers.isAddress(walletAddress)) {
        throw new Error('Invalid Polygon wallet address');
      }

      const contract = new ethers.Contract(
        this.macsTokenPolygon,
        this.macsTokenABI,
        this.polygonProvider
      );

      const balance = await contract.balanceOf(walletAddress);
      const decimals = await contract.decimals();
      
      return {
        balance: ethers.formatUnits(balance, decimals),
        balanceWei: balance.toString(),
        decimals: decimals.toString()
      };
    } catch (error) {
      logger.error('Error getting Polygon balance:', error);
      throw new Error(`Failed to get Polygon balance: ${error.message}`);
    }
  }

  async getPolygonTransactionHistory(walletAddress, limit = 50) {
    try {
      // In production, you would use a service like Moralis, Alchemy, or The Graph
      // For now, we'll return mock data structure
      return {
        transactions: [],
        hasMore: false,
        nextCursor: null
      };
    } catch (error) {
      logger.error('Error getting Polygon transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  async estimatePolygonGas(from, to, amount) {
    try {
      const contract = new ethers.Contract(
        this.macsTokenPolygon,
        this.macsTokenABI,
        this.polygonProvider
      );

      const gasEstimate = await contract.transfer.estimateGas(to, ethers.parseUnits(amount, 18));
      const gasPrice = await this.polygonProvider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice.toString(),
        estimatedFee: (gasEstimate * gasPrice.gasPrice).toString()
      };
    } catch (error) {
      logger.error('Error estimating Polygon gas:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  // Solana blockchain methods
  async getSolanaBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Get SOL balance
      const solBalance = await this.solanaConnection.getBalance(publicKey);
      
      // Get MACS token balance (would need to implement SPL token balance check)
      // For now, returning mock structure
      return {
        solBalance: solBalance / 1e9, // Convert lamports to SOL
        macsBalance: '0', // Would implement SPL token balance
        lamports: solBalance
      };
    } catch (error) {
      logger.error('Error getting Solana balance:', error);
      throw new Error(`Failed to get Solana balance: ${error.message}`);
    }
  }

  async getSolanaTransactionHistory(walletAddress, limit = 50) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.solanaConnection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.solanaConnection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          return {
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            status: sig.err ? 'failed' : 'success',
            fee: tx?.meta?.fee || 0
          };
        })
      );

      return {
        transactions,
        hasMore: signatures.length === limit,
        nextCursor: signatures[signatures.length - 1]?.signature
      };
    } catch (error) {
      logger.error('Error getting Solana transaction history:', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }

  // Bridge methods
  async getBridgeFee(fromChain, toChain) {
    try {
      if (fromChain === 'polygon' && toChain === 'solana') {
        const contract = new ethers.Contract(
          this.bridgeContractPolygon,
          this.bridgeABI,
          this.polygonProvider
        );
        
        const fee = await contract.getBridgeFee(1); // Solana chain ID in Wormhole
        return {
          fee: ethers.formatEther(fee),
          feeWei: fee.toString(),
          currency: 'ETH'
        };
      }
      
      // Default fee structure
      return {
        fee: '0.001',
        feeWei: '1000000000000000',
        currency: 'ETH'
      };
    } catch (error) {
      logger.error('Error getting bridge fee:', error);
      throw new Error(`Failed to get bridge fee: ${error.message}`);
    }
  }

  async initiateBridge(fromChain, toChain, amount, fromAddress, toAddress) {
    try {
      // This would integrate with Wormhole or other bridge protocol
      // For now, return transaction structure
      const bridgeId = `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        bridgeId,
        status: 'initiated',
        fromChain,
        toChain,
        amount,
        fromAddress,
        toAddress,
        estimatedTime: '5-10 minutes',
        steps: [
          { step: 1, description: 'Lock tokens on source chain', status: 'pending' },
          { step: 2, description: 'Generate bridge proof', status: 'pending' },
          { step: 3, description: 'Mint tokens on destination chain', status: 'pending' }
        ]
      };
    } catch (error) {
      logger.error('Error initiating bridge:', error);
      throw new Error(`Failed to initiate bridge: ${error.message}`);
    }
  }

  async getBridgeStatus(bridgeId) {
    try {
      // In production, this would query the bridge contract or database
      return {
        bridgeId,
        status: 'completed', // pending, completed, failed
        progress: 100,
        transactionHashes: {
          source: '0x...',
          destination: '0x...'
        },
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting bridge status:', error);
      throw new Error(`Failed to get bridge status: ${error.message}`);
    }
  }

  // Utility methods
  async validateWalletAddress(address, chain) {
    try {
      if (chain === 'polygon') {
        return ethers.isAddress(address);
      } else if (chain === 'solana') {
        try {
          new PublicKey(address);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    } catch (error) {
      logger.error('Error validating wallet address:', error);
      return false;
    }
  }

  async getTokenPrice() {
    try {
      // In production, integrate with CoinGecko, CoinMarketCap, or DEX APIs
      return {
        usd: 2.00,
        change24h: 2.56,
        marketCap: 2000000,
        volume24h: 450000,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting token price:', error);
      throw new Error(`Failed to get token price: ${error.message}`);
    }
  }

  async getNetworkStats() {
    try {
      const [polygonBlock, solanaSlot] = await Promise.all([
        this.polygonProvider.getBlockNumber(),
        this.solanaConnection.getSlot()
      ]);

      return {
        polygon: {
          latestBlock: polygonBlock,
          chainId: 137
        },
        solana: {
          latestSlot: solanaSlot,
          cluster: 'mainnet-beta'
        },
        bridge: {
          totalVolume: '2100000',
          totalTransactions: 15420,
          averageFee: '0.001'
        }
      };
    } catch (error) {
      logger.error('Error getting network stats:', error);
      throw new Error(`Failed to get network stats: ${error.message}`);
    }
  }
}

module.exports = new BlockchainService();

