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

template DoubleMerkleProof(levels) {
    signal input leaf;
    signal input mainProofIndices[levels];
    signal input subsetProofIndices[levels];
    signal input mainProof[levels];
    signal input subsetProof[levels];

    signal output root;
    signal output subsetRoot;

    component selectors1[levels];
    component selectors2[levels];

    component hashers1[levels];
    component hashers2[levels];

    for (var i = 0; i < levels; i++) {
        selectors1[i] = DualMux();
        selectors1[i].in[0] <== i == 0 ? leaf : hashers1[i - 1].out;
        selectors1[i].in[1] <== mainProof[i];
        selectors1[i].s <== mainProofIndices[i];

        hashers1[i] = Poseidon(2);
        hashers1[i].inputs[0] <== selectors1[i].out[0];
        hashers1[i].inputs[1] <== selectors1[i].out[1];

        selectors2[i] = DualMux();
        selectors2[i].in[0] <== i == 0 ? leaf : hashers2[i - 1].out;
        selectors2[i].in[1] <== subsetProof[i];
        selectors2[i].s <== subsetProofIndices[i];

        hashers2[i] = Poseidon(2);
        hashers2[i].inputs[0] <== selectors2[i].out[0];
        hashers2[i].inputs[1] <== selectors2[i].out[1];
    }

    root <== hashers1[levels - 1].out;
    subsetRoot <== hashers2[levels - 1].out;
}

template WithdrawFromSubset(levels) {
    // public
    signal input root;
    signal input subsetRoot;
    signal input nullifierHash;
    signal input recipient;
    signal input relayer;
    signal input fee;

    // private
    signal input nullifier;
    signal input mainProofIndices[levels];
    signal input subsetProofIndices[levels];
    signal input mainProof[levels];
    signal input subsetProof[levels];

    component leafIndexNum = Bits2Num(levels);
    for (var i = 0; i < levels; i++) {
        leafIndexNum.in[i] <== mainProofIndices[i];
    }

    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.inputs[1] <== 1;
    nullifierHasher.inputs[2] <== leafIndexNum.out;
    nullifierHasher.out === nullifierHash;

    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== 0;

    component doubleTree = DoubleMerkleProof(levels);

    doubleTree.leaf <== commitmentHasher.out;

    for (var i = 0; i < levels; i++) {
        doubleTree.mainProof[i] <== mainProof[i];
        doubleTree.subsetProof[i] <== subsetProof[i];
        doubleTree.mainProofIndices[i] <== mainProofIndices[i];
        doubleTree.subsetProofIndices[i] <== subsetProofIndices[i];
    }

    doubleTree.root === root;
    doubleTree.subsetRoot === subsetRoot;

    // Add hidden signals to make sure that tampering with recipient will invalidate the snark proof
    // Most likely it is not required, but it's better to stay on the safe side and it only takes 2 constraints
    // Squares are used to prevent optimizer from removing those constraints
    signal recipientSquare;
    signal relayerSquare;
    signal feeSquare;
    recipientSquare <== recipient * recipient;
    relayerSquare <== relayer * relayer;
    feeSquare <== fee * fee;
}

component main {
    public [
        root,
        subsetRoot,
        nullifierHash,
        recipient,
        relayer,
        fee
    ]
} = WithdrawFromSubset(
    20
);