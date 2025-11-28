import React, { useState, useEffect } from 'react'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'

// Create client once (MetaMask signing assumed)
const client = createClient({
  chain: studionet,
  account: window.ethereum.selectedAddress, // MetaMask injects address
})

export default function Quiz({ questions, onQuizSubmit }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState(Array(questions.length).fill(-1))
  const [timeLeft, setTimeLeft] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultsData, setResultsData] = useState(null)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (timeLeft === 0) {
      handleNextQuestion()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, currentQuestionIndex])

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestionIndex] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setTimeLeft(20)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      console.log('🚀 Submitting quiz answers...')
      const txHash = await client.writeContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'submit_quiz',
        args: [selectedAnswers],
      })

      const receipt = await client.waitForTransactionReceipt({
        hash: txHash,
        status: TransactionStatus.ACCEPTED,
      })

      console.log('✅ Quiz submitted successfully:', receipt)

      // Fetch results after submission
      const result = await client.readContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'get_quiz_results',
        args: [],
      })

      setResultsData(result)

      // Pass results back to parent
      const parsed = typeof result === 'string' ? JSON.parse(result) : result
      onQuizSubmit(selectedAnswers, parsed)
    } catch (err) {
      console.error('❌ Error submitting quiz:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentQuestion) {
    return <div className="text-center text-gray-400">No questions available.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">{currentQuestion.question}</h2>
      <ul>
        {currentQuestion.options.map((option, index) => (
          <li key={index}>
            <button
              onClick={() => handleAnswerSelect(index)}
              className={`px-4 py-2 rounded-lg mb-2 ${
                selectedAnswers[currentQuestionIndex] === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-gray-400">Time left: {timeLeft}s</span>
        <button
          onClick={handleNextQuestion}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white font-bold"
        >
          {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}
        </button>
      </div>
      {isSubmitting && (
        <div className="mt-6 text-center text-gray-400">Submitting your quiz...</div>
      )}
    </div>
  )
}