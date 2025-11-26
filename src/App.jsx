import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import ConnectPage from './pages/ConnectPage'
import DifficultySelection from './pages/DifficultySelection'
import NightmareSetup from './pages/NightmareSetup' // Add this import
import StudyMaterial from './pages/StudyMaterial'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import WalletInfo from './components/WalletInfo'
import genlayerLogo from './asset/logo.png'

function App() {
  const { isConnected, isDisconnected } = useAccount()
  const [currentPage, setCurrentPage] = useState('connect')
  const [quizData, setQuizData] = useState({
    difficulty: '',
    customTopic: '',
    materials: '',
    questions: [],
    answers: [],
    results: null,
  })

  useEffect(() => {
    if (isDisconnected) {
      setCurrentPage('connect')
    }
  }, [isDisconnected])

  useEffect(() => {
    if (isConnected && currentPage === 'connect') {
      setCurrentPage('select-difficulty')
    }
  }, [isConnected, currentPage])

  const handleDifficultySelect = (difficulty, customTopic = '') => {
    setQuizData((prev) => ({ ...prev, difficulty, customTopic }))
    if (difficulty === 'nightmare') {
      setCurrentPage('nightmare-setup') // Go to nightmare setup page
    } else {
      setCurrentPage('study-material') // Go directly to study materials for other difficulties
    }
  }

  const handleNightmareQuizGenerated = () => {
    setCurrentPage('study-material') // After nightmare quiz is generated, go to study materials
  }

  const handleBackFromNightmare = () => {
    setCurrentPage('select-difficulty') // Go back to difficulty selection
  }

  const handleQuizGenerated = (materials) => {
    setQuizData((prev) => ({ ...prev, materials }))
  }

  const handleStartQuiz = (questions) => {
    setQuizData((prev) => ({ ...prev, questions }))
    setCurrentPage('quiz')
  }

  const handleQuizSubmit = (answers, results) => {
    setQuizData((prev) => ({ ...prev, answers, results }))
    setCurrentPage('results')
  }

  const handleRestart = () => {
    setQuizData({
      difficulty: '',
      customTopic: '',
      materials: '',
      questions: [],
      answers: [],
      results: null,
    })
    setCurrentPage('select-difficulty')
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Absolute logo in top-left */}
      <div className="absolute top-4 left-4 z-10">
        <img src={genlayerLogo} alt="GenLayer Logo" className="h-12 w-auto cursor-pointer" />
      </div>

      {/* Spacer ensures header starts below the logo+offset */}
      <div className="h-16" />

      {/* Header line below logo, no text */}
      <header className="border-b border-gray-800 flex justify-end items-center p-4">
        {isConnected && <WalletInfo />}
      </header>

      <main className="container mx-auto p-4">
        {currentPage === 'connect' && <ConnectPage />}
        {currentPage === 'select-difficulty' && (
          <DifficultySelection onSelect={handleDifficultySelect} />
        )}
        {currentPage === 'nightmare-setup' && (
          <NightmareSetup 
            onBack={handleBackFromNightmare}
            onQuizGenerated={handleNightmareQuizGenerated}
          />
        )}
        {currentPage === 'study-material' && (
          <StudyMaterial
            difficulty={quizData.difficulty}
            customTopic={quizData.customTopic}
            onQuizGenerated={handleQuizGenerated}
            onStartQuiz={handleStartQuiz}
          />
        )}
        {currentPage === 'quiz' && (
          <Quiz
            questions={quizData.questions}
            onQuizSubmit={handleQuizSubmit}
          />
        )}
        {currentPage === 'results' && (
          <Results
            results={quizData.results}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  )
}

export default App