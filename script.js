var mapWidth = 400
var mapHeight = 300

const ConcernLevel = {
    good: {
    	level: 'Good',
     	description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#009e60'
 	},

	moderate: {
		level: 'Moderate', 
		description: "Air quality is satisfactory, and air pollution poses little or no risk.",
		color: '#ffd300'
	},

	unhealthyForSensitive: {
		level: 'Unhealthy for Sensitive Groups',
		description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#ff7518'
	},

	unhealthy: {
		level: 'Unhealthy',
		description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#ff0038'
	},

	veryUnhealthy: {
		level: 'Very Unhealth',
		description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#6f2da8'
	},

	hazardous: {
		level: 'Hazardous',
		description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#b22222'
	}
}

function getConcernLevel(aqi) {
    if (aqi <= 50) {
        return ConcernLevel.good
    } else if (aqi > 50 && aqi <= 100) {
        return ConcernLevel.moderate
    } else if (aqi > 100 && aqi <= 150) {
        return ConcernLevel.unhealthyForSensitive
    } else if (aqi > 150 && aqi <= 200) {
        return ConcernLevel.unhealthy
    } else if (aqi > 200 && aqi <= 300) {
        return ConcernLevel.veryUnhealthy
    } else {
        return ConcernLevel.hazardous
    }
}

var storedLocation = localStorage.getItem("location");
if (storedLocation === null) {
    getLocation()
} else {
    var storedLocationTokens = storedLocation.split(",")
    var lat = storedLocationTokens[0]
    var lon = storedLocationTokens[1]
    showData(lat, lon)
}


function getLocation() {
    navigator.geolocation.getCurrentPosition(processLocation,
        function(error) {
            console.log("The location request was denied")
    })
}

function updateUI(aqi) {
	const concernLevel = getConcernLevel(aqi)
	$("#aqi").html(aqi)
	$("#severity").html(concernLevel.level)
	$("#details").html(concernLevel.description)
	$("#circle").css('background-color', concernLevel.color);

    const currentDate = new Date()
    let formattedTime = currentDate.toLocaleTimeString(navigator.language)
    $("#updated").html("Updated at " + formattedTime)
}

function processLocation(position) {
    const lat = position.coords.latitude
    const lon = position.coords.longitude
    const latString = lat + "," + lon
    localStorage.setItem("location", latString)
    showData(lat, lon)
}

function showData(userLat, userLon) {
    generateMap(userLat, userLon)

    async function makeRequest(sensor) {
        const id = sensor["THINGSPEAK_PRIMARY_ID"]
        const key = sensor["THINGSPEAK_PRIMARY_ID_READ_KEY"]
        var avg = 0
        var count = 0
        const url = 'https://api.thingspeak.com/channels/' + id + '/fields/2/last.json?api_key=' + key + '&results=1';
        await $.getJSON(url, function(data) {
            var pm = data["field2"]
            var aqi = ct(pm)
            count++
            avg = (avg += aqi) / count
        });
        updateUI(avg)
    }
    const numberOfSensors = 1
    const nearestSensors = getNearestSensors(userLat, userLon, numberOfSensors)
    nearestSensors.forEach(async function(sensor) {
        makeRequest(sensor)
    })
}

function generateMap(lat, lon) {
    $("#minimap h2").hide();
    const url = "https://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=12&size="+mapWidth+"x"+mapHeight+"&key=AIzaSyChhpcGAq1GKr9BEmqYIF7tVnIjWYJnDRw"
    $("#minimap img").attr("src", url);
}
