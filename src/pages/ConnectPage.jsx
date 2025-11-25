import React from 'react'
import { useConnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'

export default function ConnectPage({ onConnect }) {
  const { connect } = useConnect()
  const { isConnected } = useAccount()

  React.useEffect(() => {
    if (isConnected) {
      onConnect()
    }
  }, [isConnected, onConnect])

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        AI & Blockchain Quiz
      </h1>
      
      <button
        onClick={() => connect({ connector: injected() })}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl"
      >
        Connect Wallet
      </button>
      
      <p className="mt-8 text-gray-400 text-sm">
        Created by jrkenny
      </p>
    </div>
  )
}