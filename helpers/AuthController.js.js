const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
//
exports.registerToken = (SessionName) => {
	//
	if (SessionName) {
		return jwt.sign({ token: SessionName }, authConfig.secret, {
			expiresIn: authConfig.expiresIn
		});
	}else{
		return false;
	}
}
//
exports.verifyToken = (tokenJwt) => {
	//
	if (tokenJwt) {
		return jwt.verify(tokenJwt, authConfig.secret, function (err, decoded) {
			if (err) {
				return false;
			} else {
				return true;
			}
		});
	}else{
		return false;
	}
}
