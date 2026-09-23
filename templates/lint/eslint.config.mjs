import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['.next/**', 'next-env.d.ts', 'eslint.config.mjs'] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
)
