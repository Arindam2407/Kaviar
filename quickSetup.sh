PHASE1=build/phase1_final.ptau
PHASE2=build/phase2_final.ptau
CIRCUIT_ZKEY=build/circuit_final.zkey

# Untrusted phase 2
npx snarkjs powersoftau prepare phase2 $PHASE1 $PHASE2 -v

npx snarkjs zkey new build/withdraw_from_subset.r1cs $PHASE2 $CIRCUIT_ZKEY

npx snarkjs zkey export verificationkey $CIRCUIT_ZKEY build/verification_key.json

npx snarkjs zkey export solidityverifier $CIRCUIT_ZKEY contracts/Verifier.sol
# Fix solidity version (and want the command to work on both linux and mac)
cd contracts/ && sed 's/0\.6\.11/0\.8\.10/g' Verifier.sol > tmp.txt && mv tmp.txt Verifier.sol
