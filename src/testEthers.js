import { ethers } from "ethers";

// For browser-based apps (e.g., MetaMask)
async function connectWallet() {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log("Connected wallet address:", await signer.getAddress());
  } else {
    console.log("No wallet found");
  }
}

connectWallet();