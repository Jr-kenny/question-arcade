import { ethers } from "ethers";
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Clock, LogOut, Loader2, Zap } from 'lucide-react';

// --- GENLAYER CONTRACT CONFIGURATION ---
const CONTRACT_ADDRESS = '0x29dc7aB1951748d814B85e0117d05d83DB2fd65c';
const GENLAYER_CHAIN_ID = "0xF27F"; // 61999 in hex

async function ensureGenLayerNetwork() {
  const provider = window.ethereum;
  if (!provider) {
    console.error("No window.ethereum provider");
    return;
  }

  try {
    const currentChainId = await provider.request({ method: "eth_chainId" });
    console.log("Current chain ID:", currentChainId);

    if (currentChainId !== GENLAYER_CHAIN_ID) {
      try {
        console.log("Attempting to switch to GenLayer chain...");
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: GENLAYER_CHAIN_ID }],
        });
        console.log("Switch successful");
      } catch (switchError) {
        console.warn("Switch error:", switchError);

        if (switchError.code === 4902) {
          console.log("Chain not found, trying to add GenLayer...");
          try {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: GENLAYER_CHAIN_ID,
                  chainName: "GenLayer Studio",
                  rpcUrls: ["https://studio.genlayer.com/api"],
                  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
                  blockExplorerUrls: ["https://studio.genlayer.com/explorer"],
                },
              ],
            });
            console.log("GenLayer chain added, switching again...");
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: GENLAYER_CHAIN_ID }],
            });
            console.log("Switch after add successful");
          } catch (addError) {
            console.error("Error adding chain:", addError);
          }
        } else {
          console.error("Error code not 4902:", switchError);
        }
      }
    } else {
      console.log("Already on GenLayer chain");
    }
  } catch (err) {
    console.error("Error in ensureGenLayerNetwork:", err);
  }
}

const CONTRACT_ABI = [
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

const GENLAYER_NETWORK_PARAMS = {
  chainId: '0xf27f',
  chainName: 'GenLayer Studio',
  nativeCurrency: {
    name: 'GEN',
    symbol: 'GEN',
    decimals: 18
  },
  rpcUrls: ['https://studio.genlayer.com/api'],
};

export default function App() {
  const [page, setPage] = useState('connect');
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(20);
  const [isActive, setIsActive] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
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
        if (currentQuestion < quizData.questions.length - 1) {
          moveToNextQuestion();
        } else {
          submitQuiz();
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, currentQuestion, quizData?.questions]);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) {
        showError('MetaMask or Web3 wallet not found. Please install MetaMask.');
        setLoading(false);
        return;
      }

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      const address = accounts[0];
      setWallet(address);

      // Switch to GenLayer Studio network
      const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (currentChainId !== GENLAYER_NETWORK_PARAMS.chainId)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: GENLAYER_NETWORK_PARAMS.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [GENLAYER_NETWORK_PARAMS],
            });
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: GENLAYER_NETWORK_PARAMS.chainId }],
            });
          } catch (addError) {
            showError('Failed to add GenLayer Studio network.');
            setLoading(false);
            return;
          }
        } else {
          showError('Failed to switch network.');
          setLoading(false);
          return;
        }
      }

      // Initialize ethers
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);

      setPage('difficulty');
      showToast('Wallet connected successfully!');
    } catch (err) {
      console.error('Wallet connection failed:', err);
      showError(err?.message || 'Connection failed');
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!wallet || !difficulty || !contract) return;
    setLoading(true);
    setError(null);
    showToast(`Generating ${difficulty} quiz...`);

    try {
      // Call generate_quiz on the contract
      const tx = await contract.generate_quiz(difficulty, wallet);
      showToast('Waiting for transaction confirmation...');
      
      const receipt = await tx.wait();
      
      if (!receipt) {
        showError('Transaction failed - no receipt received');
        setLoading(false);
        return;
      }

      // Extract the result from transaction logs or data
      // Note: GenLayer contracts return results through logs or events
      // Check the transaction for the returned quiz data
      let quizResult = null;
      
      // Attempt to parse from receipt logs or transaction data
      if (receipt.logs && receipt.logs.length > 0) {
        // Try to extract from logs
        try {
          const decodedLog = receipt.logs[0];
          if (decodedLog.data) {
            quizResult = ethers.toUtf8String(decodedLog.data);
          }
        } catch (logError) {
          console.warn('Could not decode from logs:', logError);
        }
      }

      // If no result from logs, try calling a view function or re-querying
      if (!quizResult) {
        showError('Could not retrieve quiz data from contract response');
        setLoading(false);
        return;
      }

      // Parse the quiz data
      let parsedData;
      try {
        parsedData = JSON.parse(quizResult);
      } catch (parseError) {
        console.error('Failed to parse quiz data:', parseError);
        showError('Invalid quiz data format from contract');
        setLoading(false);
        return;
      }

      if (!parsedData.material || !parsedData.questions || parsedData.questions.length === 0) {
        showError('Quiz data missing required fields');
        setLoading(false);
        return;
      }

      setQuizData({
        material: parsedData.material,
        questions: parsedData.questions
      });

      setPage('material');
      showToast('Quiz generated by GenLayer AI!');
    } catch (err) {
      console.error('Quiz generation failed:', err);
      showError(err?.message || 'Failed to generate quiz');
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
    if (quizData && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(20);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!quizData || !quizData.questions || !wallet || !contract) return;
    setIsActive(false);
    setLoading(true);
    setError(null);
    showToast('Submitting answers to GenLayer for grading...');

    const userAnswersJSON = JSON.stringify(userAnswers);

    try {
      // Call submit_quiz on the contract
      const tx = await contract.submit_quiz(difficulty, userAnswersJSON, wallet);
      showToast('Waiting for grading...');
      
      const receipt = await tx.wait();

      if (!receipt) {
        showError('Transaction failed - no receipt received');
        setLoading(false);
        return;
      }

      // Extract grading results from transaction
      let gradingResult = null;

      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const decodedLog = receipt.logs[0];
          if (decodedLog.data) {
            gradingResult = ethers.toUtf8String(decodedLog.data);
          }
        } catch (logError) {
          console.warn('Could not decode grading from logs:', logError);
        }
      }

      if (!gradingResult) {
        showError('Could not retrieve grading results from contract');
        setLoading(false);
        return;
      }

      // Parse grading results
      let parsedResults;
      try {
        parsedResults = JSON.parse(gradingResult);
      } catch (parseError) {
        console.error('Failed to parse grading results:', parseError);
        showError('Invalid grading format from contract');
        setLoading(false);
        return;
      }

      if (!parsedResults.score || parsedResults.total === undefined || !parsedResults.answers) {
        showError('Grading results missing required fields');
        setLoading(false);
        return;
      }

      setResults(parsedResults);
      setPage('results');
      showToast('Quiz graded by AI consensus!');
    } catch (err) {
      console.error('Quiz submission failed:', err);
      showError(err?.message || 'Failed to submit quiz');
    }
    setLoading(false);
  };

  const storeResultOnChain = async () => {
    if (!results || !wallet || !difficulty || !contract) return;
    setLoading(true);
    setError(null);
    showToast('Storing result permanently on-chain...');

    const resultJSON = JSON.stringify({
      score: results.score,
      total: results.total,
      percentage: results.percentage,
      passed: results.passed,
    });

    try {
      const tx = await contract.store_result_on_chain(wallet, difficulty, resultJSON);
      showToast('Waiting for confirmation...');
      await tx.wait();
      showToast('Result stored on-chain successfully!');
    } catch (err) {
      console.error('Store on chain failed:', err);
      showError(err?.message || 'Failed to store result on-chain');
    }
    setLoading(false);
  };

  const resetQuiz = () => {
    setDifficulty(null);
    setQuizData(null);
    setResults(null);
    setCurrentQuestion(0);
    setUserAnswers({});
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

  // --- UI COMPONENTS ---

  const DifficultyButton = ({ level, label, count, color }) => (
    <button
      onClick={() => {
        setDifficulty(level);
        generateQuiz();
      }}
      disabled={loading}
      className={`flex flex-col items-center justify-center ${color} hover:shadow-2xl transition transform hover:scale-[1.02] text-white p-8 rounded-xl text-center shadow-lg disabled:opacity-50 relative`}
    >
      {loading && difficulty === level && (
        <Loader2 className="absolute top-2 right-2 animate-spin text-white" size={24} />
      )}
      <div className="text-3xl font-extrabold mb-2">{label}</div>
      <div className="text-sm font-light">{count} Questions</div>
    </button>
  );

  const Toast = ({ message }) => (
    <div className={`fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-lg shadow-2xl transition-opacity duration-300 max-w-sm ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {message}
    </div>
  );

  const ErrorBanner = ({ message }) => (
    <div className={`fixed top-4 right-4 p-4 bg-red-600 text-white rounded-lg shadow-2xl transition-opacity duration-300 max-w-sm flex items-start gap-3 ${message ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
      <div>{message}</div>
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
          <p className="text-lg text-gray-300 mb-8">AI-Powered, Consensus-Validated Quiz Platform</p>
          <button
            onClick={connectWallet}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition disabled:opacity-50 shadow-lg flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Connect MetaMask'}
          </button>
          <p className="text-xs text-gray-400 mt-6">Contract: {CONTRACT_ADDRESS}</p>
          <p className="text-xs text-gray-400 mt-2">Network: GenLayer Studio Testnet</p>
        </div>
        <Toast message={toastMessage} />
        <ErrorBanner message={error} />
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
            <p className="text-gray-300 text-sm">Wallet: <span className="font-mono text-cyan-300">{wallet?.slice(0, 10)}...{wallet?.slice(-8)}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DifficultyButton level="easy" label="Easy" count={10} color="bg-green-600 hover:bg-green-700" />
            <DifficultyButton level="mid" label="Medium" count={20} color="bg-yellow-600 hover:bg-yellow-700" />
            <DifficultyButton level="hard" label="Hard" count={30} color="bg-red-600 hover:bg-red-700" />
          </div>
          {loading && (
            <p className="text-center text-cyan-300 mt-6 font-semibold flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Calling GenLayer contract...
            </p>
          )}
        </div>
        <Toast message={toastMessage} />
        <ErrorBanner message={error} />
      </div>
    );
  }

  // Material Display
  if (page === 'material' && quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pt-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-4">Study Material - {difficulty?.toUpperCase()}</h1>
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 text-white mb-8 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Generated by AI Consensus</h2>
            <div className="max-h-[60vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">{quizData.material}</pre>
            </div>
          </div>
          <button
            onClick={startQuiz}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 rounded-xl text-lg transition shadow-lg"
          >
            Start Quiz ({quizData.questions?.length} Questions)
          </button>
        </div>
        <Toast message={toastMessage} />
        <ErrorBanner message={error} />
      </div>
    );
  }

  // Quiz Page
  if (page === 'quiz' && quizData?.questions && quizData.questions.length > 0) {
    const q = quizData.questions[currentQuestion];
    const answered = userAnswers[currentQuestion + 1];

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
                  <span className="font-extrabold mr-3">{key}:</span> {value}
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
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Submit & Grade'}
              </button>
            )}
          </div>
        </div>
        <Toast message={toastMessage} />
        <ErrorBanner message={error} />
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
          <h1 className="text-4xl font-extrabold text-white mb-8 text-center">Grading Complete</h1>

          <div className={`bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 mb-8 shadow-2xl ${statusBg}`}>
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 rounded-full ${statusColor}`}>{statusIcon}</div>
            </div>
            <div className="text-center">
              <div className={`text-7xl font-bold ${statusColor} mb-2`}>
                {Math.round(percentage)}%
              </div>
              <div className={`text-2xl font-semibold ${statusColor} mb-6`}>
                {results.passed ? '✓ Passed!' : '✗ Keep Practicing'}
              </div>
              <p className="text-gray-300 text-lg">Score: <span className="font-mono font-bold text-cyan-300">{results.score} / {results.total}</span></p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Answer Breakdown</h2>
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
                    <p className="font-semibold mb-2">Question {ans.question_id}</p>
                    <p className="text-gray-400 text-sm mb-1">Your Answer: <span className="font-bold text-cyan-400">{ans.user_answer}</span></p>
                    <p className="text-gray-400 text-sm mb-2">Correct: <span className="font-bold text-green-400">{ans.correct_answer}</span></p>
                    <p className="text-gray-500 text-xs italic">{ans.explanation}</p>
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
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Store on Chain'}
            </button>
          </div>
        </div>
        <Toast message={toastMessage} />
        <ErrorBanner message={error} />
      </div>
    );
  }

  return null;
}