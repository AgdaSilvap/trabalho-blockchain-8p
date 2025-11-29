import { getEthereumContract } from "./contract";

export async function queryCertificate(fileHash: string) {
  try {
    const contract = await getEthereumContract();
    const data = await contract.getCertificate(fileHash);

    return {
      issuer: data[0],
      personName: data[1],
      certificationName: data[2],
      issueDate: Number(data[3]),
      expiryDate: Number(data[4]),
    };
  } catch (err) {
    console.error("Erro ao consultar o certificado:", err);
    throw err;
  }
}
