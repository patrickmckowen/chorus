module.exports = {
	parser: '@typescript-eslint/parser',
	extends: ['@react-native', 'plugin:@typescript-eslint/recommended', 'prettier'],
	plugins: ['@typescript-eslint'],
	ignorePatterns: ['node_modules/', 'ios/', 'android/'],
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
	},
	env: {
		es6: true,
		jest: true,
		node: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
		'import/resolver': {
			typescript: {},
		},
	},
	rules: {},
};

