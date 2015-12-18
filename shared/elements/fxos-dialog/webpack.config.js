
var externals = {
  'fxos-component': {
    root: 'fxosComponent',
    commonjs: 'fxos-component',
    commonjs2: 'fxos-component',
    amd: 'fxos-component'
  },

  './fxos-dialog': {
    root: 'FXOSDialog',
    commonjs: './fxos-dialog',
    commonjs2: './fxos-dialog',
    amd: './fxos-dialog'
  }
};

module.exports = [
  {
    externals: externals,
    entry: './src/fxos-dialog-action.js',
    output: {
      filename: 'fxos-dialog-action.js',
      library: 'FXOSDialogAction',
      libraryTarget: 'umd'
    }
  },

  {
    externals: externals,
    entry: './src/fxos-dialog-alert.js',
    output: {
      filename: 'fxos-dialog-alert.js',
      library: 'FXOSDialogAlert',
      libraryTarget: 'umd'
    }
  },

  {
    externals: externals,
    entry: './src/fxos-dialog-confirm.js',
    output: {
      filename: 'fxos-dialog-confirm.js',
      library: 'FXOSDialogConfirm',
      libraryTarget: 'umd'
    }
  },

  {
    externals: externals,
    entry: './src/fxos-dialog-menu.js',
    output: {
      filename: 'fxos-dialog-menu.js',
      library: 'FXOSDialogMenu',
      libraryTarget: 'umd'
    }
  },

  {
    externals: externals,
    entry: './src/fxos-dialog-prompt.js',
    output: {
      filename: 'fxos-dialog-prompt.js',
      library: 'FXOSDialogPrompt',
      libraryTarget: 'umd'
    }
  },

  {
    externals: externals,
    entry: './src/fxos-dialog-select.js',
    output: {
      filename: 'fxos-dialog-select.js',
      library: 'FXOSDialogSelect',
      libraryTarget: 'umd'
    }
  },

  {
    entry: './src/fxos-dialog.js',
    output: {
      filename: 'fxos-dialog.js',
      library: 'FXOSDialog',
      libraryTarget: 'umd'
    },

    externals: {
      'fxos-component': externals['fxos-component']
    }
  }
];
