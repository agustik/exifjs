module.exports = {
	setup :  {
		exiftool : (/^win/.test(process.platform)) ? 'exiftool.exe' : 'exiftool',
		index : true
	},
	get : function (file, callback) {
		this.run(file, function (e,d){
			callback(e,d);
		});
	},
	run : function (file, callback ){
		var _root = this;
		setTimeout(function(){
			var isWin = /^win/.test(process.platform);
			var separator = (isWin) ? '\\' : '/';
			var command = _root.setup.exiftool  + ' -j "'+file+'"',
				exec = require('child_process').exec,
			    child, x;

			    child = exec(command,
				    function (error, stdout, stderr) {
				        if(stdout!==''){
				           data = JSON.parse(stdout);
				           data = data[0];
				           data = _root.skip(data);
				           data['SourceFile'] = file;
				           x = file.split(separator);
				           data['safn'] = x[x.length-2];
				           data['unixtimestamps'] = _root.exiftimestamps(data['XMPFileStamps']);
				           x = x.slice(0,x.length-1).join(separator);
				           data['Directory'] = x
				           data = _root.fixtime(data);

				           callback(null, data);
				        }
				        if(stderr!==''){
				           callback(stderr)
				        }
				        if (error !== null) {
				            callback(error)
				        }
				    });
		},0);
	},
	fixtime : function (d){
		var parent = this, timestamp, value;
		var key, date_format = "YYYY-MM-DD hh:mm",  tofix = ['ProfileDateTime', 'FileModifyDate','FileAccessDate','FileCreateDate','ReleaseDate', 'DateCreated'];
		for (key in d ){
			if (tofix.indexOf(key) !==-1){
				value = d[key];
				if(value !== undefined){

					timestamp = parent.ExifTimeStamp(value, date_format);
					d[key] = timestamp;
					d['epoch_'+key] = timestamp.date().getTime() / 1000;
					
				}
			}
		}
		return d;
	},
	exiftimestamps : function (d){
		var x, arr = [], parent = this;
		if(typeof d == 'string'){
			d = [d];
		}
		if(typeof d == 'array'){
			if(d.length > 0){
				d.forEach(function (exiftimestamp){
					x = parent.MatchExifTimestamp(exiftimestamp);
					if(x !== false){
						arr.push(parent.ExifTimeStamp(exiftimestamp,'unix'));
					}
				});
				return arr;
			}
		}else{
			return '';
		}
	},
	MatchExifTimestamp : function (time){
		var x = {
			year :'',
			month : '',
			day : '',
			hour : '',
			minute : ''
		};
		if(/^([0-9]{4,4}):([0-9]{2,2}):([0-9]{2,2})\s([0-9]{2,2}):([0-9]{2,2})/.test(time)){

			x.year 		= time.substring(0,4);
			x.month 	= time.substring(5,7);
			x.day 		= time.substring(8,10);
			x.hour		= time.substring(11,13);
			x.minute 	= time.substring(14,16);
			return x;
		}else{
			return false;
		}
	},
	ExifTimeStamp : function(timestamp, type){
		type = (type) ? type : 'YYYY-MM-DD hh:mm';
		var x = this.MatchExifTimestamp(timestamp);
		if (!x){
			return timestamp.date(type);
		}else{
			var timestring = x.year + '-' + x.day + '-' + x.month + ' ' + x.hour +':' + x.minute;
			if(type == 'unix'){
				return timestring.date().getTime() / 1000;
			}else{
				return timestring.date(type);
			}
		}
	},
	clean : function (d){
		var key, value, skip = [], obj = {};
		d = JSON.parse(d);
		for (key in d ){
			if(skip.indexOf(key) == -1){
				obj[key] = d[key];
			}
			
		}
		return obj;
	},
	skip : function(d){
		var key, value, obj={}, index = this.setup.index;
		for (key in d){
			if (index == true){
				obj[key] = d[key];
			}else if (index.indexOf(key) !==-1 ){
				obj[key] = d[key];
			}
		}
		return obj;
	}

};