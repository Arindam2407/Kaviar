# Kaviar
## Cross-Chain Compliant Currency-Mixer

### Ethereum Singapore 2023 Hackathon
We create a cross-chain compliant currency-mixer based on the paper [Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364) by Buterin et al. 2023.

Specifically we

- Use Poseidon Hash for tree hashing, nullifier hashing, and commitment construction

```
commitment = PoseidonHash(nullifier, 0)
nullifierHash = PoseidonHash(nullifier, 1, leafIndex)
```

- Use [Privacy Pools](https://github.com/ameensol/privacy-pools) to block blacklisted actors from using the protocol.

- Use [Axelar](https://github.com/axelarnetwork/axelar-core) to bridge assets between two chains.
