[
	{
		"UID": "01",
		"sport": "football",
		"type": "league",
		"name": "Premier League 2011",
		"participants": [
			{"name":"Man Utd", "position":1, "played":3, "goalDiff":10, "points":9},
			{"name":"Man City", "position":2, "played":3, "goalDiff":9, "points":9},
			{"name":"Liverpool", "position":3, "played":3, "goalDiff":4, "points":7},
			{"name":"Chelsea", "position":4, "played":3, "goalDiff":3, "points":7}
		],
		//"parent": "undefined",
		"time": {
			"start": "October 13, 2011 11:30:00",
			"end": "May 13, 2012 13:00:00",
			"duration": "months",
			"state": "live"
		},
		"location": {
			"country": "UK"
		}
	},
	{
		"UID": "02",
		"sport": "football",
		"type": "match",
		"name": "Man U vs Chelsea",
		"participants": [
			{"name":"Man Utd", "position":null, "goalDiff":0, "home": "true"},
			{"name":"Chelsea", "position":null, "goalDiff":0}
		],
		"parent": "01",
		"time": {
			"start": "October 13, 2011 11:30:00",
			"end": "October 13, 2011 13:00:00",
			"duration": "1:30:00",
			"state": "pre"
		},
		"location": {
			"country": "UK",
			"town": "manchester",
			"postcode":"cb11 3dj", // for GEO / Maps
			"title":"Manchester United Stadium"
		}
	},
	{
		"UID": "03",
		"sport": "football",
		"type": "match",
		"name": "Liverpool vs Man City",
		"participants": [
			{"name":"Liverpool", "position":null, "goalDiff":0},
			{"name":"Man City", "position":null, "goalDiff":0}
		],
		"parent": "01",
		"time": {
			"start": "October 13, 2011 11:30:00",
			"end": "October 13, 2011 13:00:00",
			"duration": "1:30:00",
			"state": "pre"
		},
		"location": {
			"country": "UK"
		}
	},
	{
		"UID": "04",
		"sport": "forumula 1",
		"type": "f1 race",
		"name": "Silverstone British GP - Q1",
		"participants": [
			{
			"name":"Jenson Button",
			"team":"Mclaren", 
			"overallPosition":"null", 
			"Q1": {"position":1, "time": "1.24"},
			"Q2": {"position":1, "time": "1.24"},
			"Q3": {"position":1, "time": "1.24"},
			"race": {"position":1, "time": "1:12:24"}
			}
		],
		"parent": "05",
		"time": {
			"start": "October 13, 2011 11:30:00",
			"end": "October 13, 2011 13:00:00",
			"duration": "1:30:00",
			"state": "pre"
		},
		"location": {
			"country": "UK"
		}
	},
	{
		"UID": "05",
		"sport": "forumula 1",
		"type": "2011 f1 league",
		"name": "2011 F1 Season",
		"participants": [
			{ "name":"Jenson Button", "team":"Mclaren", "driverPos":1, "teamPos":2 }
		],
		"time": {
			"start": "March 13, 2011 11:30:00",
			"end": "November 1, 2011 13:00:00"
		}
	},
]
