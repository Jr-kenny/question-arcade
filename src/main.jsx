import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { genlayer } from './chains'
import App from './App'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css'

const config = getDefaultConfig({
  appName: 'quiz arcade', // updated to match your WalletConnect project name
  projectId: '48ed7827383e8e0501c7caedd188a131', // your WalletConnect Cloud project ID
  chains: [genlayer],
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)