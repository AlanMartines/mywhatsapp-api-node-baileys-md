//
/*
const ConnectFailureReason = {
    Generic: 400,
    LoggedOut: 401,
    TempBanned: 402,
    MainDeviceGone: 403, // this is now called LOCKED in the WhatsApp Web code
    UnknownLogout: 406, // this is now called BANNED in the WhatsApp Web code
    ClientOutdated: 405,
    BadUserAgent: 409,
    CATExpired: 413,
    CATInvalid: 414,
    NotFound: 415,
    InternalServerError: 500,
    Experimental: 501,
    ServiceUnavailable: 503
};

const connectFailureReasonMessage = {
    [ConnectFailureReason.LoggedOut]: "logged out from another device",
    [ConnectFailureReason.TempBanned]: "account temporarily banned",
    [ConnectFailureReason.MainDeviceGone]: "primary device was logged out", // seems to happen for both bans and switching phones
    [ConnectFailureReason.UnknownLogout]: "logged out for unknown reason",
    [ConnectFailureReason.ClientOutdated]: "client is out of date",
    [ConnectFailureReason.BadUserAgent]: "client user agent was rejected",
    [ConnectFailureReason.CATExpired]: "messenger crypto auth token has expired",
    [ConnectFailureReason.CATInvalid]: "messenger crypto auth token is invalid",
};

// Exportando os objetos para uso em outros módulos
module.exports = {
    ConnectFailureReason,
    connectFailureReasonMessage
};

*/
var addJson {};
let resDisconnectReason = {
	loggedOut: 401,
	bannedTimetamp: 402,
	bannedTemporary: 403,
	timedOut: 408,
	connectionLost: 408,
	multideviceMismatch: 411,
	connectionClosed: 428,
	connectionReplaced: 440,
	badSession: 500,
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
