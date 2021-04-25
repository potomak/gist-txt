module.exports = {
  "env": {
    "node": true,
    "browser": true,
    "es6": true
  },
  "plugins": [
    "jest",
    "flowtype"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:jest/recommended",
    "plugin:flowtype/recommended"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 2015,
    "sourceType": "module"
  },
  "rules": {
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "never"
    ]
  }
}
