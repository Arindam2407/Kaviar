pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    out[0] <== (in[1] - in[0])*s + in[0];
    out[1] <== (in[0] - in[1])*s + in[1];
}

template DoubleMerkleProof(levels, expectedValue) {
    signal input leaf;
    signal input root;
    signal input subsetRoot;

    signal input path;
    signal input mainProof[levels];
    signal input subsetProof[levels];

    component selectors1[levels];
    component selectors2[levels];

    component hashers1[levels];
    component hashers2[levels];

    component pathBits = Num2Bits(levels);
    pathBits.in <== path;

    for (var i = 0; i < levels; i++) {
        selectors1[i] = DualMux();
        selectors1[i].in[0] <== i == 0 ? leaf : hashers1[i - 1].out;
        selectors1[i].in[1] <== mainProof[i];
        selectors1[i].s <== pathBits.out[i];
        hashers1[i] = Poseidon(2);
        hashers1[i].inputs[0] <== selectors1[i].out[0];
        hashers1[i].inputs[1] <== selectors1[i].out[1];

        selectors2[i] = DualMux();
        selectors2[i].in[0] <== i == 0 ? expectedValue : hashers2[i - 1].out;
        selectors2[i].in[1] <== subsetProof[i];
        selectors2[i].s <== pathBits.out[i];
        hashers2[i] = Poseidon(2);
        hashers2[i].inputs[0] <== selectors2[i].out[0];
        hashers2[i].inputs[1] <== selectors2[i].out[1];
    }

    root === hashers1[levels - 1].out;
    subsetRoot === hashers2[levels - 1].out;
}

template WithdrawFromSubset(levels, expectedValue) {
    // public
    signal input root;
    signal input subsetRoot;
    signal input nullifierHash;
    signal input withdrawMetadata;

    // private
    signal input nullifier;
    signal input path;
    signal input mainProof[levels];
    signal input subsetProof[levels];

    component rawCommitmentHasher = Poseidon(1);
    rawCommitmentHasher.inputs[0] <== nullifier;

    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== rawCommitmentHasher.out;
    commitmentHasher.inputs[1] <== 0;

    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== 1;
    nullifierHasher.inputs[2] <== path;
    nullifierHash === nullifierHasher.out;

    component doubleTree = DoubleMerkleProof(levels, expectedValue);
    doubleTree.leaf <== commitmentHasher.out;
    doubleTree.root <== root;
    doubleTree.subsetRoot <== subsetRoot;

    for (var i = 0; i < levels; i++) {
        doubleTree.mainProof[i] <== mainProof[i];
        doubleTree.subsetProof[i] <== subsetProof[i];
    }

    doubleTree.path <== path;

    signal withdrawMetadataSquare;
    withdrawMetadataSquare <== withdrawMetadata * withdrawMetadata;
}

component main {
    public [
        root,
        subsetRoot,
        nullifierHash,
        withdrawMetadata
    ]
} = WithdrawFromSubset(
    20,
    // keccak256("allowed") % p
    11954255677048767585730959529592939615262310191150853775895456173962480955685
);