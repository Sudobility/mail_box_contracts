import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Global ignores - these override all other configs
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'artifacts/**',
      'cache/**',
      'typechain-types/**',
      'target/**',
      'coverage/**',
      '**/*.d.ts',
      '.ai/**',
      // JSX/TSX files that require React parser config
      'examples/react-usage.tsx',
      'examples/stateless-client-usage.ts',
      'examples/stateless-usage.ts',
      'src/react/**',
    ],
  },

  // JavaScript files
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      // General JavaScript/Node.js
      'no-console': 'off', // Allow console.log for development
      'prefer-const': 'error',
      'no-var': 'error',

      // Style preferences for AI development
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
    },
  },

  // TypeScript files - properly configured with TypeScript parser
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      ...tsPlugin.configs.recommended.rules,
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      // More lenient rules for test files
      'no-unused-expressions': 'off', // For chai assertions
      '@typescript-eslint/no-unused-expressions': 'off', // For chai assertions
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests for simplicity
    },
  },
  {
    files: ['scripts/**/*.ts', 'examples/**/*.ts'],
    rules: {
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      // Allow console.log in scripts and examples
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in examples/scripts
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in scripts for flexibility
      '@typescript-eslint/no-require-imports': 'off', // Allow require() in scripts
    },
  },
];
