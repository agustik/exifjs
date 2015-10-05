'use strict'

/**
 * @Author: Ágúst Ingi Kjartansson <agust.ingi.kjartansson@gmail.com>
 * @LICENSE: GPL-V2
 */

require("date-format-lite");
var Promise = require('promise');
var exec = require('child_process').exec;

/**
 * Parses time from exif, REGEX
 */
var TimeRegexShort = new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}Z/);
var TimeRegexLong = new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}\+[\d]{2,2}:[\d]{2,2}/);
var TimeRegexBasic = new RegExp(/[\d]{4,4}-[\d]{2,2}-[\d]{2,2}/);

/**
 * Checks if windows
 * @return {bool}  - True if windows
 */
var windows = /^win/.test(process.platform);

/**
 * Defines exiftool default
 */
var exiftool;
if (windows){
	exiftool = 'exiftool.exe';
}else{
	exiftool = 'exiftool';
}

/**
 * Exif main functioon
 * @param  {object} params - Object with settings of any
 * @return {object|Array}        - Object or Array of objects
 */
var exif = function (params){
	if (!params){
		params = {
			epoch : 'ms'
		};
	}
	if('exiftool' in params){
		exiftool = params.exiftool;
	}
	return {
		/**
		 * Access point, validates function and then passes to exec;
		 * @param  {string|Array}   file 	- String or array with file paths
		 * @param  {Function} callback 	 	- Callback to call after
		 * @return {object}            		- Promise
		 */
		get : function (file, callback ){
			callback =  (typeof callback === 'function') ? callback : function (){};
			return this._exec(file, callback);
		},
		_exec : function (file, callback){
			var _root = this;
			return new Promise( function (resolve, reject) {
				setTimeout(function(){
					var command, child, obj;
					if(Array.isArray(file)){
						file = file.map(function (f){
							return '"' + f + '"';
						}).join(' ');
					}else{
						file = '"'+ file +'"';
					}
					command = exiftool  + ' '+file+' -j';
					child = exec(command,
						function (error, stdout, stderr) {
							if (error || stdout =='') {
									reject(error);
									callback(error);
									return;
							}

							var arr=[], data;
								// try to parse to json
								data  = _root._parseJSON(stdout);
							// if no json key, then callback error
							if(!data.object){
								callback(data);
								return;
							}

							// if many ..
							for ( var i = 0; i < data.object.length ; i++ ){
								obj = data.object[i];
								arr.push(_root._timestamps(obj));
							}
							if(arr.length === 1){
								arr = arr[0];
							}
							resolve(arr);
							callback(null, arr);
							return;

						});
				}, 0);
			});
		},
		/**
		 * Parses all keys and trys to parse date to epoch
		 * @param  {object} object - Exif object
		 * @return {object}        - Exif object parsed
		 */
		_timestamps : function (object){
			var value, self = this, newObj = {};
			for (var key in object){
				value = object[key];

				newObj[key] = '';

				if(typeof value ==='string'){
					newObj[key] = self._parseTime(value);
				}else if (typeof value === 'object' && Array.isArray(value)){
					newObj[key] = [];
					value.forEach(function (v, k){
						newObj[key].push(self._parseTime(v));
					});
				}else {
					newObj[key] =value;
				}

			}

			return newObj;
		},
		/**
		 * Parse time function, retuns same string of not time
		 * @param  {string} timestamp - Value from exif object
		 * @return {string|int}           - Epoch time if like time
		 */
		_parseTime : function (timestamp){
			if (
				TimeRegexLong.test(timestamp) ||
				TimeRegexShort.test(timestamp) ||
				TimeRegexBasic.test(timestamp)
				){
				var time = timestamp.date().getTime();
				if(params.epoch === 's'){
					time = time / 1000;
				}
				return time;
			}else{
				return timestamp;
			}

		},
		/**
		 * Json Parser, returns exepction if error else object
		 * @param  {string} string - Input json to parse
		 * @return {object}        - Error or js object
		 */
		_parseJSON : function (string){
			try {
				return {
					object :JSON.parse(string)
				};
			}catch(e){
				return e;
			}
		}
	}
};

/**
 * Exports exif module
 * @type {object}
 */
module.exports = exif;
