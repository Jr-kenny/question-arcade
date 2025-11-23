import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, LogOut, Loader2, Zap } from 'lucide-react';
import { ethers } from 'ethers'; // Real Ethers import

// --- GENLAYER CONTRACT CONFIGURATION ---
const CONTRACT_ADDRESS = '0x29dc7aB1951748d814B85e0117d05d83DB2fd65c';
// Minimal ABI to define the interface for the required methods
const CONTRACT_ABI = [
  // generate_quiz(difficulty, user_address)
  {
    "inputs": [
      { "internalType": "string", "name": "difficulty", "type": "string" },
      { "internalType": "string", "name": "user_address", "type": "string" }
    ],
    "name": "generate_quiz",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // submit_quiz(difficulty, user_answers, user_address)
  {
    "inputs": [
      { "internalType": "string", "name": "difficulty", "type": "string" },
      { "internalType": "string", "name": "user_answers", "type": "string" },
      { "internalType": "string", "name": "user_address", "type": "string" }
    ],
    "name": "submit_quiz",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // store_result_on_chain(user_address, difficulty, result)
  {
    "inputs": [
      { "internalType": "string", "name": "user_address", "type": "string" },
      { "internalType": "string", "name": "difficulty", "type": "string" },
      { "internalType": "string", "name": "result", "type": "string" }
    ],
    "name": "store_result_on_chain",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// --- MOCK DATA FOR SIMULATION (Used when real contract interaction fails or for testing) ---

const MOCK_BASE_QUESTIONS = [
  { id: 1, text: 'What is a qubit?', options: { A: 'A classical bit', B: 'A quantum bit that can be 0, 1, or both', C: 'A unit of quantum noise', D: 'A type of quantum error' }, correct_answer: 'B' },
  { id: 2, text: 'What is superposition?', options: { A: 'When qubits are destroyed', B: 'When a qubit exists in multiple states simultaneously', C: 'A type of quantum gate', D: 'Quantum entanglement' }, correct_answer: 'B' },
  { id: 3, text: 'What does entanglement mean?', options: { A: 'Qubits are confused', B: 'Multiple qubits correlate in impossible classical ways', C: 'Qubits interfere with each other', D: 'Quantum decoherence' }, correct_answer: 'B' },
  { id: 4, text: 'What is the NISQ era?', options: { A: 'New quantum standards', B: 'Noisy Intermediate-Scale Quantum computers', C: 'Next-generation quantum', D: 'Neural Input Sequence Queue' }, correct_answer: 'B' },
];

const MOCK_MATERIAL = "GenLayer utilizes intelligent contracts and AI consensus. The core concepts of this quiz are:\n\n1. Qubit: A quantum bit (0, 1, or both).\n2. Superposition: Being in multiple states at once.\n3. Entanglement: Quantum correlation between qubits.\n4. NISQ: Noisy Intermediate-Scale Quantum era, characterized by limited, error-prone qubits.";


const generateMockQuizResponse = (numQuestions) => {
  const questions = [];
  
  for (let i = 0; i < numQuestions; i++) {
    const baseQ = MOCK_BASE_QUESTIONS[i % MOCK_BASE_QUESTIONS.length];
    
    const qWithAnswer = {
      ...baseQ,
      id: i + 1,
      text: `[Q${i + 1}] ` + baseQ.text.replace(/\[Q\d+\] /g, '')
    };
    questions.push(qWithAnswer);
  }

  const questionsWithoutAnswers = questions.map(q => {
    const { correct_answer, ...qNoAnswer } = q;
    return qNoAnswer;
  });

  return JSON.stringify({
    material: MOCK_MATERIAL,
    questions: questionsWithoutAnswers
  });
};

const generateMockSubmitResponse = (numQuestions, userAnswers) => {
  let score = 0;
  const answers = [];

  for (let i = 0; i < numQuestions; i++) {
    const q = MOCK_BASE_QUESTIONS[i % MOCK_BASE_QUESTIONS.length];
    const questionId = i + 1;
    const userAnswer = userAnswers[questionId] || 'N/A';
    const isCorrect = userAnswer === q.correct_answer; 
    if (isCorrect) score++;

    answers.push({
      question_id: questionId,
      user_answer: userAnswer,
      correct_answer: q.correct_answer,
      is_correct: isCorrect,
      explanation: isCorrect ? 'Correct! This aligns with the material on quantum fundamentals.' : 'Incorrect. Review the definition of ' + q.text.split('?')[0] + '.'
    });
  }

  const total = numQuestions;
  const percentage = (score / total) * 100;

  return JSON.stringify({
    score: score,
    total: total,
    percentage: percentage,
    passed: percentage >= 70,
    answers: answers
  });
};


export default function App() {
  const [page, setPage] = useState('connect');
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null); // Contract connected to signer
  const [difficulty, setDifficulty] = useState(null);
  const [quizData, setQuizData] = useState(null); // Contains material and questions
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [isActive, setIsActive] = useState(false);
  const [results, setResults] = useState(null); // Contains score, total, percentage, answers from submit_quiz
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && quizData?.questions) {
      if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft(t => t - 1);
        }, 1000);
      } else {
        // Time ran out on the current question
        if (currentQuestion < quizData.questions.length - 1) {
          moveToNextQuestion();
        } else {
          submitQuiz(); // Auto-submit on the last question
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, currentQuestion, quizData?.questions]);

  const connectWallet = async () => {
    setLoading(true);
    try {
      if (window.ethereum) {
        // 1. Request accounts using native MetaMask API
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        const address = accounts[0];
        setWallet(address);
        
        // 2. Initialize Ethers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);

        setPage('difficulty');
        showToast('Wallet connected successfully!');
      } else {
        // Fallback/Mock for non-Web3 environment
        setWallet('0xMockWalletAddress1234567890');
        setPage('difficulty');
        showToast('Simulated connection: No Web3 wallet detected. Using mock wallet for UI development.');
      }
    } catch (err) {
      console.error('Wallet connection failed:', err);
      showToast('Connection failed. Please ensure MetaMask is installed and unlocked.');
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!wallet || !difficulty) return;
    setLoading(true);
    showToast(`Calling contract generate_quiz('${difficulty}', '${wallet}')...`);
    
    try {
      if (contract) {
        // Real Ethers write transaction:
        const tx = await contract.generate_quiz(difficulty, wallet);
        const receipt = await tx.wait();
        // NOTE: GenLayer contracts return results in the transaction's data field for write methods.
        const rawResult = receipt.data; 
        const parsedData = JSON.parse(rawResult);
        
        setQuizData({
          material: parsedData.material,
          questions: parsedData.questions 
        });
        showToast('Quiz generated by GenLayer contract!');
      } else {
        // Mock execution for development without a real wallet/contract
        await new Promise(r => setTimeout(r, 1500)); 
        const numQuestions = difficulty === 'easy' ? 10 : difficulty === 'mid' ? 20 : 30;
        const rawResult = generateMockQuizResponse(numQuestions);
        const parsedData = JSON.parse(rawResult);
        setQuizData({
          material: parsedData.material,
          questions: parsedData.questions 
        });
        showToast('Mock Quiz generated!');
      }

      setPage('material');
      
    } catch (err) {
      console.error('GenLayer Quiz generation failed:', err);
      showToast('Contract interaction failed. See console for details (e.g., failed transaction, execution error).');
    }
    setLoading(false);
  };

  const startQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswers({});
    setTimeLeft(20);
    setIsActive(true);
    setPage('quiz');
  };

  const selectAnswer = (answer) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion + 1]: answer
    });
  };

  const moveToNextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(20);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!quizData || !quizData.questions || !wallet) return;
    setIsActive(false);
    setLoading(true);
    showToast('Submitting quiz to GenLayer contract for grading...');

    const userAnswersJSON = JSON.stringify(userAnswers);
    
    try {
      let parsedResults;
      
      if (contract) {
        // Real Ethers write transaction:
        const tx = await contract.submit_quiz(difficulty, userAnswersJSON, wallet);
        const receipt = await tx.wait();
        const rawResult = receipt.data; 
        parsedResults = JSON.parse(rawResult);
      } else {
        // Mock execution
        await new Promise(r => setTimeout(r, 1500)); 
        const numQuestions = quizData.questions.length;
        const rawResult = generateMockSubmitResponse(numQuestions, userAnswers);
        parsedResults = JSON.parse(rawResult);
      }

      setResults(parsedResults);
      setPage('results');
      showToast('Quiz graded by AI consensus!');
    } catch (err) {
      console.error('Quiz submission failed:', err);
      showToast('Grading failed. Check console for details (e.g., failed transaction, execution error).');
    }
    setLoading(false);
  };
  
  const storeResultOnChain = async () => {
    if (!results || !wallet || !difficulty) return;
    setLoading(true);
    showToast('Storing result permanently on chain...');
    
    const resultJSON = JSON.stringify(results);
    
    try {
      if (contract) {
        // Real Ethers write transaction:
        const tx = await contract.store_result_on_chain(wallet, difficulty, resultJSON);
        await tx.wait();
      } else {
        // Mock execution
        await new Promise(r => setTimeout(r, 1500)); 
      }
      
      showToast('Result stored successfully!');
    } catch (err) {
      console.error('Store on chain failed:', err);
      showToast('Failed to store on chain. Check console.');
    }
    setLoading(false);
  };


  const resetQuiz = () => {
    setDifficulty(null);
    setQuizData(null);
    setResults(null);
    setPage('difficulty');
  };

  const disconnect = () => {
    setWallet(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setPage('connect');
    resetQuiz();
    showToast('Wallet disconnected.');
  };

  // --- UI Components ---

  const DifficultyButton = ({ level, label, count, color }) => (
    <button
      onClick={() => {
        setDifficulty(level);
        generateQuiz();
      }}
      disabled={loading}
      className={`flex flex-col items-center justify-center ${color} hover:shadow-2xl transition transform hover:scale-[1.02] text-white p-8 rounded-xl text-center shadow-lg disabled:opacity-50
      ${loading && difficulty === level ? 'relative' : ''}
      `}
    >
      {loading && difficulty === level && (
        <Loader2 className="absolute top-2 right-2 animate-spin text-white" size={24} />
      )}
      <div className="text-3xl font-extrabold mb-2">{label}</div>
      <div className="text-sm font-light">{count} Questions</div>
    </button>
  );

  const Toast = ({ message }) => (
    <div className={`fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-lg shadow-2xl transition-opacity duration-300 ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {message}
    </div>
  );

  // Connect Page
  if (page === 'connect') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl max-w-sm w-full">
          <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center justify-center gap-2">
            <Zap className="text-cyan-400" size={32} /> GenLayer Quiz Arcade
          </h1>
          <p className="text-lg text-gray-300 mb-8">AI-Powered, Consensus-Validated [Image of Web3 smart contract diagram]</p>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition disabled:opacity-50 shadow-lg flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Connect MetaMask'}
          </button>
          <p className="text-xs text-gray-400 mt-4">Contract: {CONTRACT_ADDRESS.slice(0, 8)}...</p>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  // Difficulty Selection
  if (page === 'difficulty') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pt-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl font-bold text-white">Select Difficulty</h1>
            <button
              onClick={disconnect}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
            >
              <LogOut size={18} /> Disconnect
            </button>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl shadow-xl mb-8">
            <p className="text-gray-300 text-sm">Wallet: <span className="font-mono">{wallet?.slice(0, 10)}...</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DifficultyButton level="easy" label="Easy" count={10} color="bg-green-600 hover:bg-green-700" />
            <DifficultyButton level="mid" label="Medium" count={20} color="bg-yellow-600 hover:bg-yellow-700" />
            <DifficultyButton level="hard" label="Hard" count={30} color="bg-red-600 hover:bg-red-700" />
          </div>
          {loading && (
            <p className="text-center text-cyan-300 mt-6 font-semibold flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Calling GenLayer `generate_quiz`...
            </p>
          )}
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  // Material Display
  if (page === 'material') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pt-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Study Material: {difficulty.toUpperCase()}</h1>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-white mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Material Generated by AI Consensus</h2>
            <div className="max-h-[70vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">{quizData?.material}</pre>
            </div>
          </div>
          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg"
          >
            Start Quiz ({quizData?.questions?.length} Questions)
          </button>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  // Quiz Page
  if (page === 'quiz' && quizData?.questions && quizData.questions.length > 0) {
    const q = quizData.questions[currentQuestion];
    const answered = userAnswers[q.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pt-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 p-4 bg-white/10 rounded-xl shadow-lg">
            <div className="text-white font-semibold text-lg">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-colors ${
              timeLeft <= 5 ? 'bg-red-500 shadow-red-700/50' : 'bg-blue-500 shadow-blue-700/50'
            } text-white shadow-md`}>
              <Clock size={20} /> {timeLeft}s
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 mb-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 leading-relaxed">{q.text}</h2>
            <div className="space-y-4">
              {Object.entries(q.options).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => selectAnswer(key)}
                  className={`w-full p-4 rounded-xl text-left font-medium transition duration-200 border-2 ${
                    answered === key
                      ? 'bg-cyan-500 border-cyan-300 text-white shadow-lg shadow-cyan-500/50'
                      : 'bg-white bg-opacity-5 border-transparent text-gray-200 hover:bg-opacity-15 hover:border-cyan-400'
                  }`}
                >
                  <span className="font-extrabold mr-2">{key}:</span> {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {currentQuestion < quizData.questions.length - 1 ? (
              <button
                onClick={moveToNextQuestion}
                disabled={!answered}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-lg"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                disabled={!answered || loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-lg flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Submit Quiz & Grade'}
              </button>
            )}
          </div>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  // Results Page
  if (page === 'results' && results) {
    const percentage = results.percentage;
    const statusColor = results.passed ? 'text-green-400' : 'text-red-400';
    const statusBg = results.passed ? 'bg-green-800/20' : 'bg-red-800/20';
    const statusIcon = results.passed ? <CheckCircle size={32} /> : <AlertCircle size={32} />;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pt-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-white mb-8 text-center">AI Consensus Grading Complete</h1>

          <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 mb-8 shadow-2xl ${statusBg}`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 rounded-full ${statusColor}`}>{statusIcon}</div>
            </div>
            <div className="text-center">
              <div className={`text-7xl font-bold ${statusColor} mb-2`}>
                {percentage.toFixed(0)}%
              </div>
              <div className={`text-3xl font-semibold ${statusColor} mb-6`}>
                {results.passed ? 'Passed! Record your achievement.' : 'Practice More, Try Again.'}
              </div>
              <p className="text-gray-300 text-xl">Score: <span className="font-mono font-bold">{results.score} / {results.total}</span></p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Detailed Breakdown</h2>
          <div className="bg-white/5 rounded-xl p-4 shadow-lg mb-8 max-h-[40vh] overflow-y-auto space-y-3">
            {results.answers.map((ans, idx) => (
              <div key={idx} className={`p-4 rounded-xl border-l-4 ${ans.is_correct ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'}`}>
                <div className="flex items-start gap-3">
                  {ans.is_correct ? (
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                  ) : (
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
                  )}
                  <div className="flex-1 text-white">
                    <p className="font-semibold mb-1">Question {ans.question_id}</p>
                    <p className="text-gray-400 text-sm">Your Answer: <span className="font-bold text-cyan-400">{ans.user_answer}</span></p>
                    <p className="text-gray-400 text-sm">Correct: <span className="font-bold text-green-400">{ans.correct_answer}</span></p>
                    <p className="text-gray-500 text-xs mt-2 italic">{ans.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetQuiz}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl transition shadow-lg"
            >
              Take Another Quiz
            </button>
            <button
              onClick={storeResultOnChain}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-lg flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : 'Store on Chain'}
            </button>
          </div>
        </div>
        <Toast message={toastMessage} />
      </div>
    );
  }

  return null;
}
