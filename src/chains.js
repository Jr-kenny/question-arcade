// src/chains.js
import { defineChain } from 'viem'

export const genlayer = defineChain({
  id: 61999,
  name: 'GenLayer Studio',
  nativeCurrency: {
    decimals: 18,
    name: 'GEN',
    symbol: 'GEN',
  },
  rpcUrls: {
    default: {
      http: ['https://studio.genlayer.com/api'],
    },
  },
})