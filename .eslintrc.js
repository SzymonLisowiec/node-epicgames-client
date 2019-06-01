module.exports = {

	"extends": "airbnb-base",

	"rules": {
		"linebreak-style": ["error", process.env.NODE_ENV === 'prod' ? "unix" : "windows"],
		"no-trailing-spaces": "off",
		"padded-blocks": "off",
		"class-methods-use-this": "off",
		"no-param-reassign": "off",
		"max-len": [2, 200, 4],
	}
	
};