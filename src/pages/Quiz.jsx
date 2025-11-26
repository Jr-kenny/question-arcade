import React, { useState, useEffect } from 'react'
import { useContractWrite, useWaitForTransactionReceipt, useContractRead } from 'wagmi'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'
import { QUIZ_CONTRACT_ABI } from '../contract/abi'

export default function Quiz({ questions, onQuizSubmit }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState(Array(questions.length).fill(-1))
  const [timeLeft, setTimeLeft] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Correct usage of useContractWrite
  const { data: submitData, error, writeContract } = useContractWrite()

  // Read results after submission
  const { data: resultsData } = useContractRead({
    address: QUIZ_CONTRACT_ADDRESS,
    abi: QUIZ_CONTRACT_ABI,
    functionName: 'get_quiz_results',
    enabled: !!submitData?.hash,
  })

  useWaitForTransactionReceipt({
    hash: submitData?.hash,
    onSuccess: () => {
      // Results will be available via the read hook
    },
    onError: (err) => {
      setIsSubmitting(false)
      console.error('❌ Transaction failed:', err)
    },
  })

  useEffect(() => {
    if (resultsData) {
      try {
        // ✅ Don’t force JSON.parse unless your contract returns JSON
        // If resultsData is already an object/array, just pass it through
        onQuizSubmit(selectedAnswers, resultsData)
        setIsSubmitting(false)
      } catch (error) {
        console.error('Error handling results:', error)
      }
    }
  }, [resultsData, onQuizSubmit, selectedAnswers])

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

  const handleSubmit = () => {
    setIsSubmitting(true)
    try {
      writeContract({
        address: QUIZ_CONTRACT_ADDRESS,
        abi: QUIZ_CONTRACT_ABI,
        functionName: 'submit_quiz',
        args: [selectedAnswers],
        gas: BigInt(300000), // ✅ safe gas override
      })
      console.log('✅ submit_quiz called successfully')
    } catch (err) {
      setIsSubmitting(false)
      console.error('❌ Error calling submit_quiz:', err)
    }
  }

  if (!currentQuestion) {
    return <div className="text-center text-gray-400">No questions available.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Render your quiz UI here */}
      <h2 className="text-2xl font-bold mb-4">{currentQuestion.question}</h2>
      <ul>
        {currentQuestion.answers.map((answer, index) => (
          <li key={index}>
            <button
              onClick={() => handleAnswerSelect(index)}
              className={`px-4 py-2 rounded-lg mb-2 ${
                selectedAnswers[currentQuestionIndex] === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              {answer}
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