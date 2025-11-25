import React from 'react'

export default function Results({ results, onRestart }) {
  if (!results) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading results...</p>
      </div>
    )
  }

  const { score, total_questions, percentage, difficulty, detailed_results } = results
  const passed = percentage >= 60

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Grading Complete
      </h1>

      <div className="bg-white/5 rounded-2xl p-8 text-center mb-8 backdrop-blur-sm border border-white/10">
        <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {percentage}%
        </div>
        <div className={`text-2xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-red-400'}`}>
          {passed ? '🎉 Passed!' : '❌ Failed'}
        </div>
        <div className="text-gray-400">
          You scored {score} out of {total_questions}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Difficulty: {difficulty}
        </div>
      </div>

      {detailed_results && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Answer Breakdown</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {detailed_results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border backdrop-blur-sm ${
                  result.is_correct 
                    ? 'bg-green-500/10 border-green-400/30' 
                    : 'bg-red-500/10 border-red-400/30'
                }`}
              >
                <p className="font-bold text-white mb-2">Question {index + 1}: {result.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Your answer: </span>
                    <span className={result.is_correct ? 'text-green-400' : 'text-red-400'}>
                      {result.options[result.user_answer]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Correct answer: </span>
                    <span className="text-green-400">
                      {result.options[result.correct_answer]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onRestart}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-12 py-4 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-2xl"
        >
          Take Another Quiz
        </button>
      </div>
    </div>
  )
}