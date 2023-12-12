# Kaviar

## Regulatory-compliant Currency Mixer

Kaviar is a zero-knowledge protocol enabling regulatory-compliant private payments on EVM-based blockchains.

The implementation is based on the paper [Blockchain Privacy and Regulatory Compliance: Towards a Practical Equilibrium](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4563364) by Buterin et al. 2023.

The paper introduces a novel concept termed 'Privacy Pools'. The idea behind Privacy Pools is to enhance traditional currency-mixing protocols by enabling them to become regulatory-compliant. In addition to the single proof of set membership in the global pool of deposits in traditional currency-mixers, Kaviar requires users to prove membership in a restricted set of deposits. These sets/lists can be further subdivided into two kinds:

Blacklists: restricting certain blacklisted addresses from depositing in the respective subset merkle tree associated with the list.
Allowlists: only allowing certain whitelisted addresses to deposit in the respective subset merkle tree associated with the list.

## Getting started

Run the following code to get started: 

```
npm run compile
```

The command will compile the smart contracts

## Deposit

When depositing funds, the depositor needs to specify which list/set they wish to be a part of through passing in as an argument the contract address of the subset merkle tree associated with the list. This allows Kaviar to maintain a global pool like traditional currency mixers yet allow for sub-pools desirable for regulatory-compliance.

Enter the following code:

```
npm run deposit
```

After this, you will be prompted to 

Enter Chain :

Currently supported chains are 'GOERLI', 'BSC' and 'MANTLE' (Testnets),

Enter Subset Tree Address : 

Enter address of the subset merkle tree


## Withdraw

To withdraw from any chain, you will just need the deposit string that will be generated when you make the deposit. Just run the following code:

```
npm run withdraw
```

Pass in the deposit string when prompted


## Subset Tree

From the perspective of a regulatory authority, they can, like any other group/body of people, deploy their own subset merkle tree contract through Kaviar and freely blacklist/allowlist addresses. They can publish the contract address on the internet so that people willing to make compliant private payments can pass in this address to achieve their objectives. The regulatory authority can easily see which people are transacting through their sub-pool.

```
npm run deploy_subset
```

Again, you will be prompted to 

Enter Chain: 

To perform functions on the deployed subset tree, the authority/body will need to pass in the name of the supported chain, address of their subset tree contract address and the address they wish to modify privileges of. There are four possible subset tree functions, of which any subset tree allows only two depending on its status:

### For Blacklists

To Blacklist Address:

```
npm run blacklist
```

To Unblacklist Address:

```
npm run unblacklist
```

### For Allowlists

To Allowlist Address:

```
npm run allowlist
```

To Unallowlist Address:

```
npm run unallowlist
```

## Hashing

We use Poseidon Hash for tree hashing, nullifier hashing, and commitment construction

```
commitment = PoseidonHash(nullifier, 0)
nullifierHash = PoseidonHash(nullifier, 1, leafIndex)
```
