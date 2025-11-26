import React, { useState } from 'react'
import { useContractWrite, useWaitForTransactionReceipt } from 'wagmi'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'
import { QUIZ_CONTRACT_ABI } from '../contract/abi'

export default function DifficultySelection({ onSelect }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [customTopic, setCustomTopic] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)

  const { data, error, writeContract } = useContractWrite()

  useWaitForTransactionReceipt({
    hash: data?.hash,
    onSuccess: () => {
      console.log('✅ Transaction successful, moving to study-material')
      setIsWaiting(false)
      onSelect(selectedDifficulty, customTopic)
    },
    onError: (err) => {
      setIsWaiting(false)
      console.error('❌ Transaction failed:', err)
    },
  })

  const handleDifficultyClick = (difficulty) => {
    setSelectedDifficulty(difficulty)

    if (difficulty !== 'nightmare') {
      try {
        writeContract({
          address: QUIZ_CONTRACT_ADDRESS,
          abi: QUIZ_CONTRACT_ABI,
          functionName: 'generate_quiz',
          args: [difficulty, ''],
          gas: BigInt(300000),
        })
        setIsWaiting(true)
        console.log('🚀 generate_quiz transaction submitted')
      } catch (err) {
        console.error('❌ Error calling writeContract:', err)
      }
    } else {
      onSelect('nightmare', '')
    }
  }

  const handleNightmareGenerate = () => {
    if (!customTopic.trim()) {
      alert('Please enter a topic for nightmare mode')
      return
    }
    try {
      writeContract({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: QUIZ_CONTRACT_ABI,
        functionName: 'generate_quiz',
        args: ['nightmare', customTopic],
        gas: BigInt(500000),
      })
      setIsWaiting(true)
      console.log('🚀 Nightmare generate_quiz transaction submitted')
    } catch (err) {
      console.error('❌ Error calling nightmare writeContract:', err)
    }
  }

  const difficultyConfig = {
    easy: { label: 'Easy', color: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600', questions: 10 },
    mid: { label: 'Mid', color: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600', questions: 20 },
    hard: { label: 'Hard', color: 'from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600', questions: 30 },
    nightmare: { label: 'Nightmare', color: 'from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700', questions: 50 },
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Select Difficulty
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(difficultyConfig).map(([key, { label, color, questions }]) => (
          <div
            key={key}
            className={`bg-gradient-to-br ${color} p-8 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 shadow-2xl border border-white/20 backdrop-blur-sm`}
            onClick={() => handleDifficultyClick(key)}
          >
            <h2 className="text-2xl font-bold text-white mb-2">{label}</h2>
            <p className="text-white/80">{questions} questions</p>
          </div>
        ))}
      </div>

      {selectedDifficulty === 'nightmare' && (
        <div className="mt-8 p-8 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
          <h3 className="text-2xl font-bold mb-4 text-center">Enter Topic for Nightmare Mode</h3>
          <input
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g., Quantum Physics, Ancient History, Machine Learning..."
            className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleNightmareGenerate}
            disabled={isWaiting}
            className="mt-4 w-full bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-600 py-4 rounded-xl font-bold text-lg transition-all duration-200"
          >
            {isWaiting ? 'Generating Quiz...' : 'Generate Quiz'}
          </button>
        </div>
      )}

      {isWaiting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-2xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Waiting for transaction confirmation...</p>
          </div>
        </div>
      )}
    </div>
  )
}