import { BigNumberish, ethers } from "ethers";
//@ts-ignore
import { groth16 } from "snarkjs";
import path from "path";

export interface Hasher {
  hash(left: string, right: string): string;
}

export class Deposit {
  private constructor(
    public readonly nullifier: Uint8Array,
    public poseidon: any,
    public leafIndex?: number
  ) {
    this.poseidon = poseidon;
  }
  static new(poseidon: any) {
    // random nullifier (private note)
    // here we only have private nullifier
    const nullifier = ethers.utils.randomBytes(15);
    return new this(nullifier, poseidon);
  }
  // get hash of secret (nullifier)
  get commitment() {
    return poseidonHash(this.poseidon, [this.nullifier, 0]);
  }
}

export class PoseidonHasher implements Hasher {
  poseidon: any;

  constructor(poseidon: any) {
    this.poseidon = poseidon;
  }

  hash(left: string, right: string) {
    return poseidonHash(this.poseidon, [left, right]);
  }
}

export function poseidonHash(poseidon: any, inputs: any): string {
  const hash = poseidon(
    inputs.map((x: any) => ethers.BigNumber.from(x).toBigInt())
  );
  // Make the number within the field size
  const hashStr = poseidon.F.toString(hash);
  // Make it a valid hex string
  const hashHex = ethers.BigNumber.from(hashStr).toHexString();
  // pad zero to make it 32 bytes, so that the output can be taken as a bytes32 contract argument
  const bytes32 = ethers.utils.hexZeroPad(hashHex, 32);
  return bytes32;
}

// Proof Utils
export interface Proof {
  a: [BigNumberish, BigNumberish];
  b: [[BigNumberish, BigNumberish], [BigNumberish, BigNumberish]];
  c: [BigNumberish, BigNumberish];
}

export async function prove(witness: any): Promise<Proof> {
  const wasmPath = path.join(
    __dirname,
    "../build/withdraw_from_subset_js/withdraw_from_subset.wasm"
  );
  const zkeyPath = path.join(__dirname, "../build/circuit_final.zkey");

  const { proof } = await groth16.fullProve(witness, wasmPath, zkeyPath);
  const solProof: Proof = {
    a: [proof.pi_a[0], proof.pi_a[1]],
    b: [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ],
    c: [proof.pi_c[0], proof.pi_c[1]],
  };
  return solProof;
}
