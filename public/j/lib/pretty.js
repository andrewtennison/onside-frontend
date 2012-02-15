/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.

function calcDur(d){
	d = d.split(':');
	if(d.length === 2){
		var sec = d[0]*60*1000 + d[1]*1000;
		return isNaN(sec)? sec : 0;
	}else{
		return 0
	}
};

function prettyDate(time, duration){
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400),
		string = 'unknown',
		dur = 0;
		
	if ( isNaN(day_diff) ) return string;

	if(duration) dur = calcDur(duration);
	
	if(diff === 0 || (diff > 0 && diff < diff + dur) ){
		string = 'live now'
	}else if(diff < 0){
		// future
		string = day_diff == 0 && (
			-diff < 60 && "just starting" ||
			-diff < 120 && "1 minute to ago" ||
			-diff < 3600 && -Math.floor( diff / 60 ) + " minutes to ago" ||
			-diff < 7200 && "1 hour to ago" ||
			-diff < 86400 && -Math.floor( diff / 3600 ) + " hours to ago") ||
		-day_diff == 1 && "Yesterday" ||
		-day_diff < 7 && -day_diff + " days ago" ||
		-day_diff < 31 && -Math.ceil( day_diff / 7 ) + " weeks to ago" ||
		-day_diff > 31 && -Math.ceil( day_diff / 30 ) + " months to ago";
		
	}else if(diff > 0 ){
		// past
		string = day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago" ||
		day_diff > 31 && Math.ceil( day_diff / 30 ) + " months ago";
	}
	
	return string;
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" )
	jQuery.fn.prettyDate = function(){
		return this.each(function(){
			var date = prettyDate(this.title);
			if ( date )
				jQuery(this).text( date );
		});
	};
