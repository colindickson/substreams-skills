# Supported Networks

List of blockchain networks supported by Substreams.

## Ethereum and EVM Networks

### Ethereum Mainnet
- **Network ID**: `mainnet`
- **Chain ID**: 1
- **Endpoint**: `mainnet.eth.streamingfast.io:443`
- **Block Explorer**: https://etherscan.io

### Ethereum Testnets

#### Sepolia
- **Network ID**: `sepolia`
- **Chain ID**: 11155111
- **Endpoint**: `sepolia.eth.streamingfast.io:443`
- **Block Explorer**: https://sepolia.etherscan.io

#### Holesky
- **Network ID**: `holesky`
- **Chain ID**: 17000
- **Endpoint**: `holesky.eth.streamingfast.io:443`
- **Block Explorer**: https://holesky.etherscan.io

## Layer 2 Networks

### Polygon
- **Network ID**: `polygon`
- **Chain ID**: 137
- **Endpoint**: `polygon.streamingfast.io:443`
- **Block Explorer**: https://polygonscan.com

### Arbitrum One
- **Network ID**: `arbitrum`
- **Chain ID**: 42161
- **Endpoint**: `arbitrum.streamingfast.io:443`
- **Block Explorer**: https://arbiscan.io

### Optimism
- **Network ID**: `optimism`
- **Chain ID**: 10
- **Endpoint**: `optimism.streamingfast.io:443`
- **Block Explorer**: https://optimistic.etherscan.io

### Base
- **Network ID**: `base`
- **Chain ID**: 8453
- **Endpoint**: `base.streamingfast.io:443`
- **Block Explorer**: https://basescan.org

## Other EVM Networks

### Binance Smart Chain
- **Network ID**: `bsc`
- **Chain ID**: 56
- **Endpoint**: `bsc.streamingfast.io:443`
- **Block Explorer**: https://bscscan.com

### Avalanche C-Chain
- **Network ID**: `avalanche`
- **Chain ID**: 43114
- **Endpoint**: `avalanche.streamingfast.io:443`
- **Block Explorer**: https://snowtrace.io

### Fantom Opera
- **Network ID**: `fantom`
- **Chain ID**: 250
- **Endpoint**: `fantom.streamingfast.io:443`
- **Block Explorer**: https://ftmscan.com

## Non-EVM Networks

### Solana
- **Network ID**: `solana`
- **Endpoint**: `solana.streamingfast.io:443`
- **Block Explorer**: https://explorer.solana.com

### NEAR Protocol
- **Network ID**: `near`
- **Endpoint**: `near.streamingfast.io:443`
- **Block Explorer**: https://explorer.near.org

### Cosmos Hub
- **Network ID**: `cosmoshub`
- **Endpoint**: `cosmoshub.streamingfast.io:443`
- **Block Explorer**: https://www.mintscan.io/cosmos

### Injective
- **Network ID**: `injective`
- **Endpoint**: `injective.streamingfast.io:443`
- **Block Explorer**: https://explorer.injective.network

## Usage in Manifest

Specify the network in your `substreams.yaml`:

```yaml
specVersion: v0.1.0
package:
  name: my-substreams
  version: v1.0.0

network: mainnet  # Use network ID from above

modules:
  - name: map_events
    kind: map
    inputs:
      - source: sf.ethereum.type.v2.Block  # For EVM networks
      # - source: sf.solana.type.v1.Block   # For Solana
      # - source: sf.near.type.v1.Block     # For NEAR
```

## Network-Specific Considerations

### EVM Networks
- Use `sf.ethereum.type.v2.Block` as source input
- Transaction structure is consistent across EVM networks
- Gas mechanics may vary (e.g., Polygon uses MATIC, BSC uses BNB)

### Solana
- Use `sf.solana.type.v1.Block` as source input
- Different transaction structure (accounts, instructions)
- No gas concept (uses compute units and fees)

### NEAR Protocol
- Use `sf.near.type.v1.Block` as source input
- Account-based model with function calls
- Different fee structure

### Cosmos Networks
- Use `sf.cosmos.type.v1.Block` as source input
- Message-based transactions
- Different consensus mechanism (Tendermint)

## Running Substreams

Specify the endpoint when running:

```bash
# Ethereum Mainnet
substreams run -e mainnet.eth.streamingfast.io:443 substreams.yaml module_name

# Polygon
substreams run -e polygon.streamingfast.io:443 substreams.yaml module_name

# Solana
substreams run -e solana.streamingfast.io:443 substreams.yaml module_name
```

## Network Configuration

### Authentication
All networks require authentication:

```bash
export SUBSTREAMS_API_TOKEN="your-api-token"
```

### Rate Limits
- Free tier: Limited requests per minute
- Pro tier: Higher rate limits
- Enterprise: Custom rate limits

### Data Availability
- **Real-time**: Latest blocks available within seconds
- **Historical**: Full historical data available
- **Reorganizations**: Handled automatically with cursors

## Best Practices

1. **Choose the right network**: Consider transaction volume and costs
2. **Test on testnets**: Use Sepolia or Holesky for Ethereum testing
3. **Monitor performance**: Different networks have different characteristics
4. **Handle network-specific features**: Some features may not be available on all networks
5. **Consider data costs**: Historical data usage may incur costs

## Getting Access

1. Sign up at [StreamingFast](https://streamingfast.io)
2. Generate API token
3. Configure authentication
4. Start building!

For enterprise needs or additional networks, contact [StreamingFast support](mailto:support@streamingfast.io).

