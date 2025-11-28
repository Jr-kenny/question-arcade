import React, { useState } from 'react'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'

export default function NightmareSetup({ onBack, onQuizGenerated }) {
  const [customTopic, setCustomTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function getClient() {
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
    return createClient({ chain: studionet, account })
  }

  const handleGenerateQuiz = async () => {
    if (!customTopic.trim()) {
      alert('Please enter a topic for nightmare mode')
      return
    }

    setIsLoading(true)

    try {
      const client = await getClient()

      // 1. Write transaction
      const txHash = await client.writeContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'generate_quiz',
        args: ['nightmare', customTopic],
      })

      // 2. Wait for confirmation
      await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
      })

      console.log('✅ Nightmare quiz confirmed')

      // 3. Read quiz data
      const mats = await client.readContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'get_quiz_materials',
        args: [],
      })
      const qs = await client.readContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'get_quiz_questions',
        args: [],
      })

      // 4. Pass parsed data to parent
      onQuizGenerated(customTopic, JSON.parse(mats), JSON.parse(qs))

      setIsLoading(false)
    } catch (err) {
      setIsLoading(false)
      console.error('❌ Error calling nightmare generate_quiz:', err)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-red-400 bg-clip-text text-transparent">
        Nightmare Mode
      </h1>

      <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
        <h2 className="text-2xl font-bold mb-4 text-center">Enter Your Custom Topic</h2>
        <p className="text-gray-400 text-center mb-6">
          Nightmare mode will generate 50 challenging questions about your chosen topic
        </p>

        <input
          type="text"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="e.g., Quantum Physics, Ancient History, Machine Learning, Astrophysics..."
          className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
        />

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl border border-white/20 transition-colors"
          >
            Back to Difficulties
          </button>
          <button
            onClick={handleGenerateQuiz}
            disabled={isLoading || !customTopic.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 py-3 rounded-xl font-bold transition-all duration-200"
          >
            {isLoading ? 'Generating Quiz...' : 'Generate Nightmare Quiz'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-2xl text-center border border-white/10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Generating your nightmare quiz... This may take a moment.</p>
          </div>
        </div>
      )}
    </div>
  )
}