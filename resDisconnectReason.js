var addJson {};
let resDisconnectReason = {
	genericOut: 400,
	loggedOut: 401, // Logged out from another device
	bannedTimetamp: 402, // The status code 402 has a banned timetamp, account temporarily banned
	bannedTemporary: 403, // this is now called LOCKED in the WhatsApp Web code, primary device was logged out
	clientOutdated: 405, // Client is out of date
    	unknownLogout: 406, // This is now called BANNED in the WhatsApp Web code, logged out for unknown reason
	timedOut: 408,
	connectionLost: 408,
	dadUserAgent: 409, // Client user agent was rejected
	multideviceMismatch: 411,
	CATExpired: 413, // Messenger crypto auth token has expired
	CATInvalid: 414, // Messenger crypto auth token is invalid
	notFound: 415,
	connectionClosed: 428,
	connectionReplaced: 440,
	badSession: 500,
    	experimental: 501,
    	serviceUnavailable: 503,
	restartRequired: 515,
};
// Banned status codes are 403 and 402 temporary
// The status code 402 has a banned timetamp
const statusCode = lastDisconnect.error ? lastDisconnect.error?.output?.statusCode : 0;
switch (statusCode) {
	case resDisconnectReason.loggedOut:
		// Device Logged Out, Deleting Session
		logger?.info(`- Connection loggedOut`);
		//
		addJson = {
			state: "CLOSED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case resDisconnectReason.bannedTemporary:
		//
		logger?.info(`- User banned temporary`);
		//
		addJson = {
			state: "BANNED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case resDisconnectReason.bannedTimetamp:
		//
		logger?.info(`- User banned timestamp`);
		//
		addJson = {
			state: "BANNED",
			status: "notLogged",
			message: "Sistema desconectado"
		};
		//
		break;
	case resDisconnectReason.timedOut:
		//
		logger?.info(`- Connection TimedOut`);
		//
		addJson = {
			state: "CONNECTING",
			status: "desconnectedMobile",
			message: "Dispositivo conectando"
		};
		//
		break;
	case resDisconnectReason.connectionLost:
		//
		logger?.info(`- Connection Los`);
		//
		addJson = {
			message: "Dispositivo conectando",
			state: "CONNECTING",
			status: "desconnectedMobile"
		};
		//
		break;
	case resDisconnectReason.multideviceMismatch:
		//
		logger?.info('- Connection multideviceMismatch');
		//
		break;
	case resDisconnectReason.connectionClosed:
		//
		logger?.info(`- Connection connectionClosed`);
		//
		addJson = {
			message: "Sistema desconectado",
			state: "CLOSED",
			status: "notLogged"
		};
		//
		break;
	case resDisconnectReason.connectionReplaced:
		//
		// Connection Replaced, Another New Session Opened, Please Close Current Session First
		logger?.info(`- Connection connectionReplaced`);
		//
		addJson = {
			state: "DISCONNECTED",
			status: "notLogged",
			message: "Dispositivo desconectado"
		};
		//
		break;
	case resDisconnectReason.badSession:
		//
		// Bad session file, delete and run again
		logger?.info(`- Connection badSession`.red);
		//
		addJson = {
			state: "DISCONNECTED",
			status: "notLogged",
			message: "Dispositivo desconectado"
		};
		//
		break;
	case resDisconnectReason.restartRequired:
		//
		logger?.info('- Connection restartRequired');
		//
		break;
	default:
		// code block
		logger?.info(`- lastDisconnect: ${lastDisconnect?.error}`);
		//
}
//
