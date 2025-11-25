import { useAccount, useDisconnect } from 'wagmi'
import { useState } from 'react'

export default function WalletInfo() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [showDropdown, setShowDropdown] = useState(false)

  const formattedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(address)
    setShowDropdown(false)
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDropdown(false)
    // Note: The App component will handle the page change via the useAccount hook.
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
      >
        <span>{formattedAddress}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1">
          <button
            onClick={handleCopyAddress}
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
          >
            Copy Address
          </button>
          <button
            onClick={handleDisconnect}
            className="block w-full text-left px-4 py-2 hover:bg-gray-700"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
