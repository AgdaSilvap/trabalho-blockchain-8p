import { ethers } from "ethers";
import { getEthereumContract } from "./contract";

export async function registerCertificate(
  hash: `0x${string}`,
  issuer: string,
  personName: string,
  certificationName: string,
  expiryDate: number
) {
  const contract = await getEthereumContract();

  const tx = await contract.storeCertificate(
    hash,
    issuer,
    personName,
    certificationName,
    expiryDate
  );

  await tx.wait();

  return {
    success: true,
    txHash: tx.hash
  };
}
