module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['module-resolver', {
      alias: {
        '@useCases': './src/useCases',
        '@structures': './src/structures', 
        '@shared': './src/shared', 
        '@api': './src/api', 
        '@src': './src', 
      }
    }]
  ]
}