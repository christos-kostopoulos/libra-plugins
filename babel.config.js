module.exports = function(api) {
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ];
  const plugins = [
    ['babel-plugin-transform-dev', { evaluate: false }],
    ['babel-plugin-typescript-to-proptypes', { loose: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
  ];
  return {
    presets,
    plugins,
    sourceMaps: true,
    retainLines: true,
  };
};
