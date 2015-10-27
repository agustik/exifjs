'use strict'

/**
 * @Author: Ágúst Ingi Kjartansson <agust.ingi.kjartansson@gmail.com>
 * @LICENSE: GPL-V2
 */

require("date-format-lite");
var Promise = require('promise');
var Process = require('child_process');

/**
 * Parses time from exif, REGEX
 */
var ValidTimestamps = [
	new RegExp(/[\d]{4,4}-[\d]{2,2}-[\d]{2,2}/),
	new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}Z/),
	new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}/),
	new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}Z/),
	new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}\.[\d]{2,2}/),
	new RegExp(/[\d]{4,4}:[\d]{2,2}:[\d]{2,2}\s[\d]{2,2}:[\d]{2,2}:[\d]{2,2}\+[\d]{2,2}:[\d]{2,2}/)
];

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



var jobTools = {
	_fetchexif : function (files,  callback){

		var self = this;
		if(!Array.isArray(files)){
			files = [files];
		}
		files.push('-j');
		files.push('-fast2');
		return self.exiftool(files, callback);
	},
	_deleteExif : function (file, callback){
		var self = this;
		if(Array.isArray(file)){
			callback('Cannot be array');
			return;
		}
		file = ['-overwrite_original_in_place','-all=', file];
		return self.exiftool(file, callback);
	},
	exiftool : function (command, callback){
		var self = this;
		return new Promise( function (resolve, reject) {
		 var cmd = Process.spawn('C:\\temp\\exiftool.exe', command);
		 var stream = '';
		 cmd.stdout.on('data', function (chunk){
			 stream +=chunk;
		 });

		 cmd.stdout.on('close', function (data){
			resolve(stream);
			callback(null, stream);
		 });

		 cmd.stderr.on('end', function (data){
			 reject('ERROR', data);
			 //callback(data);
		 });
		 cmd.on('exit', function (code){
			 if (code != 0){
				 reject('ERROR CODE:' + stream);
				// callback('code:' +code);
			 }
		 });
	});
	},
		/**
	 * Parses all keys and trys to parse date to epoch
	 * @param  {object} object - Exif object
	 * @return {object}        - Exif object parsed
	 */
	_timestamps : function (object, format){
		var value, self = this, newObj = {};
		for (var key in object){
			value = object[key];

			newObj[key] = '';

			if(typeof value ==='string'){
				newObj[key] = self._parseTime(value, format);
			}else if (typeof value === 'object' && Array.isArray(value)){
				newObj[key] = [];
				value.forEach(function (v, k){
					newObj[key].push(self._parseTime(v, format));
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
	_parseTime : function (timestamp, format){
		format = format || 'ms';
		var time, i, regex, len = ValidTimestamps.length;
		for (i = 0; i < len; i++ ){
			regex = ValidTimestamps[i];
			if(regex.test(timestamp)){
				time = timestamp.date().getTime();
				if(format === 's'){
					time = time / 1000;
				}
				return  time;
			}
		};

		return timestamp;

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
};

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
			return jobTools._fetchexif(file, function (err, response){
				if(err){
					callback(err);
					return;
				}
				var data = jobTools._parseJSON(response);
				// if no json key, then callback error
				if(('object' in data) === false){
					callback(data);
					return;
				}

				var	arr = data.object.map(function (obj){
					return jobTools._timestamps(obj, params.epoch);
				});
				callback(null, arr);
			});
		},
		/**
		 * Deletes exif data from image
		 */
		delete : function (file, callback){
			callback =  (typeof callback === 'function') ? callback : function (){};
			return jobTools._deleteExif(file, callback);
		},
		set : function (file, attrs, callback){
			console.log(file, attrs);
		}

	}
};

/**
 * Exports exif module
 * @type {object}
 */
module.exports = exif;
