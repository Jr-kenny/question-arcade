import { useState, useEffect } from 'react'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { QUIZ_CONTRACT_ADDRESS } from '../contract/address'

// ✅ Fix: request accounts properly
async function getClient() {
  const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return createClient({ chain: studionet, account })
}

export default function StudyMaterial({ difficulty, customTopic, onQuizGenerated, onStartQuiz }) {
  const [materialsData, setMaterialsData] = useState(null)
  const [questionsData, setQuestionsData] = useState(null)
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  // Load study materials when component mounts
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setMaterialsLoading(true)
        const client = await getClient()
        const result = await client.readContract({
          address: QUIZ_CONTRACT_ADDRESS,
          functionName: 'get_quiz_materials',
          args: [],
        })
        // ✅ Parse JSON safely
        const parsed = typeof result === 'string' ? JSON.parse(result) : result
        const content = parsed.materials ?? parsed
        setMaterialsData(content)
        // ✅ Notify parent with parsed content
        onQuizGenerated(content)
      } catch (error) {
        console.error('❌ Error fetching materials:', error)
      } finally {
        setMaterialsLoading(false)
      }
    }
    fetchMaterials()
  }, [onQuizGenerated])

  const handleStartQuiz = async () => {
    setIsStarting(true)
    try {
      setQuestionsLoading(true)
      const client = await getClient()
      const result = await client.readContract({
        address: QUIZ_CONTRACT_ADDRESS,
        functionName: 'get_quiz_questions',
        args: [],
      })
      const parsed = typeof result === 'string' ? JSON.parse(result) : result
      const quizQuestions = parsed.questions ?? parsed
      setQuestionsData(quizQuestions)
      // ✅ Notify parent with parsed questions
      onStartQuiz(quizQuestions)
    } catch (error) {
      console.error('❌ Error fetching questions:', error)
      onStartQuiz([])
    } finally {
      setQuestionsLoading(false)
      setIsStarting(false)
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
          {materialsData ? (
            <pre className="whitespace-pre-wrap font-sans">
              {materialsData || 'No materials available.'}
            </pre>
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