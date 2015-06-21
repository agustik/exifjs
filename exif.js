require("date-format-lite");
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

			var command, 
				exec = require('child_process').exec,
				child, x;
			if (typeof file == 'object'){
				var c="";
				for (k in file){
					c += '"' + file[k] + '" '; 
				}
				file = c;
			}else{
				file = '"'+ file +'"';
			}
			
			command = _root.setup.exiftool  + ' '+file+' -j';
			    child = exec(command,
				    function (error, stdout, stderr) {
				        if(stdout!==''){

				        	var arr=[];
				         	// try to parse to json
							data  = _root.parse(stdout);

							// if no json key, then callback error
							if(!data.json){
								callback(data);
								return;
							}

							for (i in data.json){
								arr.push(_root.clean(data.json[i], file));
							}
							callback(null, arr);
							return true;
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

	parse : function (string){
		try {
			return {
				json :JSON.parse(string)
			};
		}catch(e){
			return e;
		}

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
		if(typeof d == 'object'){
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


		var data, _root=this;

		data = _root.skip(d);
		data['epoch_XMPFileStamps'] = _root.exiftimestamps(data['XMPFileStamps']);
		data = _root.fixtime(data);

		return data;
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