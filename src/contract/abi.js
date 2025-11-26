export const QUIZ_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'generate_quiz',
    inputs: [
      { internalType: 'string', name: 'difficulty', type: 'string' },
      { internalType: 'string', name: 'custom_topic', type: 'string' },
    ],
    outputs: [{ internalType: 'string', type: 'string' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'get_quiz_materials',
    inputs: [],
    outputs: [{ internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'get_quiz_questions',
    inputs: [],
    outputs: [{ internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'submit_quiz',
    inputs: [{ internalType: 'uint256[]', name: 'answers', type: 'uint256[]' }],
    outputs: [{ internalType: 'string', type: 'string' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'get_quiz_results',
    inputs: [],
    outputs: [{ internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
]