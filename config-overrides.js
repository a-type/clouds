module.exports = function override(config, env) {
  module.config.rules.push({
    test: /\.worker\.ts$/,
    use: { loader: 'workerize-loader' },
  });
  return config;
}