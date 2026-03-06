/** @type {import("prettier").Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: false,
  arrowParens: 'always',
  jsxSingleQuote: true,
  bracketSameLine: false,
  proseWrap: 'always',
  htmlWhitespaceSensitivity: 'strict',
  embeddedLanguageFormatting: 'auto',

  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
    'prettier-plugin-organize-attributes',
    'prettier-plugin-packagejson',
  ],

  attributeGroups: [
    '^id$',
    '^class$',
    '^className$',
    '^aria-.*$',
    '^on.*$',
    '$DEFAULT',
  ],

  importOrder: [
    '^(react/(.*)$)|^(react$)',
    '<BUILTIN_MODULES>',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/(.*)$',
    '',
    '^[./]',
    '',
    '.(css|scss|sass|less)$',
  ],

  importOrder: [
    '^@core/(.*)$',
    '',
    '^@server/(.*)$',
    '',
    '^@ui/(.*)$',
    '',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
  importOrderCaseSensitive: false,
};
