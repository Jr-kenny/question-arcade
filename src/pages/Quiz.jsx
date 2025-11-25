import React, { useState, useEffect } from 'react'
import { useContractWrite, useWaitForTransactionReceipt, useContractRead } from 'wagmi'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'
import { QUIZ_CONTRACT_ABI } from '../contract/abi'

export default function Quiz({ questions, onQuizSubmit }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState(Array(questions.length).fill(-1))
  const [timeLeft, setTimeLeft] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { write: submitQuiz, data: submitData } = useContractWrite({
    address: QUIZ_CONTRACT_ADDRESS,
    abi: QUIZ_CONTRACT_ABI,
    functionName: 'submit_quiz',
  })

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
  })

  useEffect(() => {
    if (resultsData) {
      try {
        const results = JSON.parse(resultsData)
        onQuizSubmit(selectedAnswers, results)
        setIsSubmitting(false)
      } catch (error) {
        console.error('Error parsing results:', error)
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
    submitQuiz({ args: [selectedAnswers] })
  }

  if (!currentQuestion) {
    return <div className="text-center text-gray-400">No questions available.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ...rest of your JSX unchanged... */}
    </div>
  )
}