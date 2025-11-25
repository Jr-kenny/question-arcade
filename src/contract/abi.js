export const QUIZ_CONTRACT_ABI = [
  {
    type: 'function',
    name: 'generate_quiz',
    inputs: [
      { name: 'difficulty', type: 'string' },
      { name: 'custom_topic', type: 'string' },
    ],
    outputs: [{ type: 'string' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'get_quiz_materials',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'get_quiz_questions',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'submit_quiz',
    inputs: [{ name: 'answers', type: 'uint256[]' }],
    outputs: [{ type: 'string' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'get_quiz_results',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
]
