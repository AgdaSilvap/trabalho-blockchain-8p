import { ethers } from "ethers";

const contractAddress = "0x4a159aca68cda67841b6882721d6789827bcba0b";

const abi = [
  "function storeCertificate(bytes32,string,string,string,uint256)",
  "function getCertificate(bytes32) view returns (string,string,string,uint256,uint256)"
];

export async function getEthereumContract() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
}
