const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#D16B02',
              '@layout-header-background': 'transparent'
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ]
};
