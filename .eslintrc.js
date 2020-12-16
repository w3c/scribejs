module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    env: {
        browser: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules" : {
        "no-console" : 0, // set it to 0 if it is o.k. to have console.log
        "@typescript-eslint/no-explicit-any" : 0,
        "no-constant-condition": [
            "error",
            {
                "checkLoops" : false
            }
        ],
        "indent" : [
            "error", 4
        ],
        "no-var-requires": 0,
        "no-multi-spaces": [
            "error",
            {
                "exceptions": {
                    "VariableDeclarator": true,
                    "ImportDeclaration" : true
                }
            }
        ],
        "no-else-return": 0,
        "max-len": [
            "error",
            {
                "code": 150,
                "ignoreComments" : true,
                "ignoreUrls" : true,
                "ignoreStrings" : true,
                "ignoreTemplateLiterals" : true,
                "ignoreRegExpLiterals" : true
            }
        ],
        "key-spacing" : [
            "error",
            {
                "align" : {
                    "beforeColon" : true,
                    "afterColon"  : true,
                    "on" : "colon"
                },
                "multiLine" : {
                    "beforeColon" : true,
                    "afterColon"  : true
                }
            }
        ],
        "comma-dangle" : [
            "error",
            "always-multiline",
            {
                "functions" : "never",
            }
        ],
        "arrow-parens" : [
            "error",
            "always"
        ],
        "no-plusplus": [
            "error",
            {
                "allowForLoopAfterthoughts": true
            }
        ],
        "no-param-reassign" : [
            "error",
            {
                "props" : false
            }
        ],
        "prefer-destructuring": 0,
        "consistent-return": 2,
        "no-eval": 2,
        "no-implied-eval": 2,

        "array-callback-return": 2,

        "eqeqeq": [
            "error",
            "smart"
        ],

        "no-label-var": 2,
        "no-shadow": 2,
        "func-name-matching": 2,

        "keyword-spacing" : [
            "error",
            {
                "before" : true,
                "after" : true
            }
        ],

        "max-lines-per-function": [
            1,
            {
                "max": 80,
                "skipBlankLines": true,
                "skipComments": true,
            }
        ]
    }
};
