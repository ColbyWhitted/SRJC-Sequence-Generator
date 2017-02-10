// Recommended Course Sequence Generator - 
//	Web Application Programming Interface
// ---------------------------------------
//

var RCSGWAPI = (function() {
	
	/* ***************** */
	/* Module: Constants */
	/* ***************** */
	
	var RCSG_URL = "redacted";
	var RCSG_REQ_KEY_TOKEN = "Token";
	var RCSG_REQ_KEY_COMMAND = "Command";
	var RCSG_REQ_KEY_ARGUMENTS = "Arguments";
	var RCSG_TOKEN_DELAY = 1000 * 1;
	var RCSG_ERROR_DELAY = 1000 * 30;
	var RCSG_RES_KEY_STATUS = "Status";
	var RCSG_RES_VAL_STATUS_SUCCESS = "Success";
	var RCSG_RES_VAL_STATUS_FAILURE = "Failure";
	var RCSG_RES_VAL_STATUS_PENDING = "Pending";
	var RCSG_RES_KEY_LOG = "Log";
	var RCSG_RES_KEY_LOG_KEY_SEVERITY = "Severity";
	var RCSG_RES_KEY_LOG_VAL_SEVERITY_ERROR = "Error";
	var RCSG_RES_KEY_LOG_VAL_SEVERITY_WARNING = "Warning";
	var RCSG_RES_KEY_LOG_VAL_SEVERITY_INFORMATION = "Information";
	var RCSG_RES_KEY_LOG_VAL_SEVERITY_DEVELOPMENT = "Development";
	var RCSG_RES_KEY_LOG_KEY_MESSAGE = "Message";
	var RCSG_RES_KEY_LOG_KEY_TIMESTAMP = "Timestamp";
	var RCSG_RES_KEY_RESULT = "Result";
	
	/* ***************** */
	/* Module: Variables */
	/* ***************** */
	
	var _log = [];
	var _cache_program_list = null;
	var _cache_program_detail = {};
	var _module = {};
	
	/* ************************* */
	/* Module: Private Interface */
	/* ************************* */
	
	function _wapi_parse_response(response, callback) {
		_log = response[RCSG_RES_KEY_LOG];
		if ( response[RCSG_RES_KEY_STATUS] === RCSG_RES_VAL_STATUS_FAILURE ) {
			callback(null);
		} else if ( response[RCSG_RES_KEY_STATUS] === RCSG_RES_VAL_STATUS_SUCCESS ) {
			callback(response[RCSG_RES_KEY_RESULT]);
		} else {
			throw new Error("Unknown response status, '" + response[RCSG_RES_KEY_STATUS] + "'.");
		}
		return;
	}
	
	function _wapi_invoke_command(callback, cmdName, cmdArgs, cmdToken) {
		params = "argv=";
		if ( cmdToken !== undefined ) {
			params += JSON.stringify({
				[RCSG_REQ_KEY_TOKEN]: cmdToken
			});
		} else {
			params += JSON.stringify({
				[RCSG_REQ_KEY_COMMAND]: cmdName,
				[RCSG_REQ_KEY_ARGUMENTS]: ((cmdArgs === undefined) ? ({}) : (cmdArgs))
			});
		}
		httpRequest = new XMLHttpRequest();
		httpRequest.onload = function() {
			if ( (httpRequest.readyState === 4) && (httpRequest.status === 200) ) {
				response = JSON.parse(httpRequest.responseText);
				if ( response[RCSG_RES_KEY_STATUS] === RCSG_RES_VAL_STATUS_PENDING ) {
					setTimeout(function() {
						_wapi_invoke_command(
							callback,
							undefined, 
							undefined,
							response[RCSG_REQ_KEY_TOKEN]
						);
					}, RCSG_TOKEN_DELAY);
				} else {
					_wapi_parse_response(response, callback);
				}
			}
		}
		httpRequest.onerror = function() {
			setTimeout(function() {
				_wapi_invoke_command(
					callback,
					cmdName,
					cmdArgs,
					cmdToken
				);
			}, RCSG_ERROR_DELAY);
		}
		httpRequest.open("POST", RCSG_URL, true);
		httpRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		httpRequest.send(params);
		return;
	}
	
	function _wapi_get_messages(severity) {
		var msgs = [];
		for ( var i = 0; i < _log.length; ++i ) {
			if ( _log[i][RCSG_RES_KEY_LOG_KEY_SEVERITY] === severity ) {
				msgs.push(_log[i]);
			}
		}
		return msgs;
	}
	
	function _wapi_get_messages_simple(severity) {
		var logs = _wapi_get_messages(severity);
		var msgs = [];
		for ( var i = 0; i < logs.length; ++i ) {
			msgs.push(logs[i][RCSG_RES_KEY_LOG_KEY_MESSAGE]);
		}
		return msgs;
	}
	
	/* ************************ */
	/* Module: Public Interface */
	/* ************************ */
	
	/*
	Method: RCSGWAPI.flush
		Some RCSG-WAPI invocations have their results cached locally. This 
		method will clear these locally cached results.
	*/
	_module.flush = function() {
		_cache_program_list = null;
		_cache_program_detail = {};
		return;
	}
	
	/*
	Method: RCSGWAPI.getMessagesSimpleError
	Return:
		An array of strings representing the error-level severity messages from 
		the last RCSG-WAPI command invocation.
	*/
	_module.getMessagesSimpleError = function() {
		return _wapi_get_messages_simple(RCSG_RES_KEY_LOG_VAL_SEVERITY_ERROR);
	}
	
	/*
	Method: RCSGWAPI.getMessagesSimpleWarning
	Return:
		An array of strings representing the warning-level severity messages 
		from the last RCSG-WAPI command invocation.
	*/
	_module.getMessagesSimpleWarning = function() {
		return _wapi_get_messages_simple(RCSG_RES_KEY_LOG_VAL_SEVERITY_WARNING);
	}
	
	/*
	Method: RCSGWAPI.getMessagesSimpleInformation
	Return:
		An array of strings representing the information-level severity messages 
		from the last RCSG-WAPI command invocation.
	*/
	_module.getMessagesSimpleInformation = function() {
		return _wapi_get_messages_simple(RCSG_RES_KEY_LOG_VAL_SEVERITY_INFORMATION);
	}
	
	/*
	Method: RCSGWAPI.getMessagesSimpleDevelopment
	Return:
		An array of strings representing the development-level severity messages 
		from the last RCSG-WAPI command invocation.
	*/
	_module.getMessagesSimpleDevelopment = function() {
		return _wapi_get_messages_simple(RCSG_RES_KEY_LOG_VAL_SEVERITY_DEVELOPMENT);
	}
	
	/*
	Method: RCSGWAPI.getPrograms
		Invokes the RCSG-WAPI "Program List" command.
	Parameter: 'callback' (function, optional)
		The callback function, if provided, will be invoked with a single 
		argument, a list of program names.
	Return:
		If a callback is provided, this method does not return a value. If 
		a callback is not provided, this method will return, if immediately 
		available, the list of program names, and null otherwise.
	*/
	_module.getPrograms = function(callback) {
		if ( _cache_program_list !== null ) {
			if ( callback === undefined ) {
				return _cache_program_list;
			}
			callback(_cache_program_list);
		} else {
			if ( callback === undefined ) {
				return null;
			}
			_wapi_invoke_command(function(result) {
				callback(_cache_program_list = result["Programs"]);
				return;
			}, "Program List");
		}
		return;
	}
	
	/*
	Method: RCSGWAPI.getProgramDetails
		Invokes the RCSG-WAPI "Program Details" command.
	Parameter: 'programName' (string, required)
		The name identifying the program.
	Parameter: 'callback' (function, optional)
		The callback function, if provided, will be invoked with a single 
		argument, an object containing the details of requested program, and
		null otherwise.
	Return:
		If a callback is provided, this method does not return a value. If a 
		callback is not provided, this method will return, if immediately 
		available, an object containing the details of requested program, and 
		null otherwise.
	*/
	_module.getProgramDetails = function(programName, callback) {
		if ( programName in _cache_program_detail ) {
			if ( callback === undefined ) {
				return _cache_program_detail[programName];
			}
			callback(_cache_program_detail[programName]);
		} else {
			if ( callback === undefined ) {
				return null;
			}
			_wapi_invoke_command(function(result) {
				callback(_cache_program_detail[programName] = result);
				return;
			}, "Program Details", {"Program": programName});
		}
		return;
	}
	
	/*
	Method: RCSGWAPI.schedule
		Invokes the RCSG-WAPI "Schedule" command.
	Parameter: 'programName' (string, required)
		The name identifying the program.
	Parameter: 'callback' (function, required)
		The callback function will be invoked with a single argument, an array 
		of schedules, or null if no schedule exists.
	Parameter: 'options' (object, optional)
		If provided, an object containing zero or more of the key-value 
		parameter pairs described in the schedule command documentation.
	Return: (undefined)
		This method does not return any value.	
	*/
	_module.schedule = function(programName, callback, options) {
		options = ((options === undefined) ? ({}) : (options));
		options = JSON.parse(JSON.stringify(options));
		options["Program"] = programName;
		_wapi_invoke_command(function(result) {
			callback(result["Schedules"]);
			return;
		}, "Schedule", options);
	}
	
	return _module;
})();