import { useContractRead } from 'wagmi'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'
import { QUIZ_CONTRACT_ABI } from '../contract/abi'
import { useState } from 'react'

export default function StudyMaterial({ difficulty, customTopic, onQuizGenerated, onStartQuiz }) {
  const [isStarting, setIsStarting] = useState(false)

  const { data: materialsData, isLoading: materialsLoading } = useContractRead({
    address: QUIZ_CONTRACT_ADDRESS,
    abi: QUIZ_CONTRACT_ABI,
    functionName: 'get_quiz_materials',
  })

  const { data: questionsData, isLoading: questionsLoading } = useContractRead({
    address: QUIZ_CONTRACT_ADDRESS,
    abi: QUIZ_CONTRACT_ABI,
    functionName: 'get_quiz_questions',
  })

  // Parse the materials data
  let materials = ''
  if (materialsData) {
    try {
      const parsed = JSON.parse(materialsData)
      materials = parsed.materials
    } catch (error) {
      console.error('Error parsing materials:', error)
    }
  }

  const handleStartQuiz = async () => {
    setIsStarting(true)
    // If we haven't fetched questions yet, we wait for them
    if (questionsData) {
      try {
        const parsed = JSON.parse(questionsData)
        onStartQuiz(parsed.questions)
      } catch (error) {
        console.error('Error parsing questions:', error)
      }
    }
  }

  if (materialsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p>Loading study materials...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        Study Material - {difficulty}
        {customTopic && ` - ${customTopic}`}
      </h1>

      <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
        <div className="prose prose-invert max-w-none">
          {materials ? (
            <pre className="whitespace-pre-wrap font-sans">{materials}</pre>
          ) : (
            <p>No materials available.</p>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handleStartQuiz}
          disabled={isStarting || questionsLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 px-8 py-3 rounded-lg font-bold text-lg"
        >
          {isStarting || questionsLoading ? 'Loading Questions...' : 'Start Quiz'}
        </button>
      </div>
    </div>
  )
}