var mapWidth = 400
var mapHeight = 300

var ConcernLevel = {
    good: {
    	level: 'Good',
     	description: "Air quality is satisfactory, and air pollution poses little or no risk.",
     	color: '#009e60'
 	},

	moderate: {
		level: 'Moderate',
		description: "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
		color: '#ffd300'
	},

	unhealthyForSensitive: {
		level: 'Unhealthy',
		description: "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
     	color: '#ff7518'
	},

	unhealthy: {
		level: 'Unhealthy for Sensitive Groups',
		description: "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
     	color: '#ff0038'
	},

	veryUnhealthy: {
		level: 'Very Unhealthy',
		description: "Health alert: The risk of health effects is increased for everyone.",
     	color: '#6f2da8'
	},

	hazardous: {
		level: 'Hazardous',
		description: "Health warning of emergency conditions: everyone is more likely to be affected.",
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

requestApproximateLocation()
var storedLocation = localStorage.getItem("location");
if (storedLocation === null) {
    requestPreciseLocation()
} else {
    var storedLocationTokens = storedLocation.split(",")
    var lat = storedLocationTokens[0]
    var lon = storedLocationTokens[1]
    showData(lat, lon)
}

$("#locationButton").click(function() {
    requestPreciseLocation()
})

function showAddress(addr) {
    $("#city input").val(addr)
}

function requestApproximateLocation() {
    $.getJSON('https://ipinfo.io/json?token=35b3c9341b6578', function(data) {
        showAddress(data.city + ", " + data.region)
        var locTokens = data.loc.split(",")
        var lat = locTokens[0]
        var lon  = locTokens[1]
        showData(lat, lon)
    });
}

function requestPreciseLocation() {
    navigator.geolocation.getCurrentPosition(processLocation,
        function(error) {
            console.log("The location request was denied")
    })
}

function updateUI(aqi) {
	var concernLevel = getConcernLevel(aqi)
	$("#aqi").html(aqi)
	$("#severity").html(concernLevel.level)
	$("#details").html(concernLevel.description)
	$("#circle").css('background-color', concernLevel.color);

    var currentDate = new Date()
    let formattedTime = currentDate.toLocaleTimeString(navigator.language)
    $("#updated").html("Updated at " + formattedTime)
}

function processLocation(position) {
    var lat = position.coords.latitude
    var lon = position.coords.longitude
    var latString = lat + "," + lon
    console.log("requested location: ", latString)
    localStorage.setItem("location", latString)
    showData(lat, lon)
}

function showData(userLat, userLon) {
    generateMap(userLat, userLon)

    async function makeRequest(sensor) {
        var id = sensor["THINGSPEAK_PRIMARY_ID"]
        var key = sensor["THINGSPEAK_PRIMARY_ID_READ_KEY"]
        var avg = 0
        var count = 0
        var url = 'https://api.thingspeak.com/channels/' + id + '/fields/2/last.json?api_key=' + key + '&results=1';
        await $.getJSON(url, function(data) {
            var pm = data["field2"]
            var aqi = ct(pm)
            count++
            avg = (avg += aqi) / count
        });
        updateUI(avg)
    }
    var numberOfSensors = 1
    var nearestSensors = getNearestSensors(userLat, userLon, numberOfSensors)
    nearestSensors.forEach(async function(sensor) {
        makeRequest(sensor)
    })
}

function generateMap(lat, lon) {
    $("#minimap h2").hide();
    var url = "https://maps.googleapis.com/maps/api/staticmap?center=" + lat + "," + lon + "&zoom=12&size="+mapWidth+"x"+mapHeight+"&key=AIzaSyChhpcGAq1GKr9BEmqYIF7tVnIjWYJnDRw"
    $("#minimap img").attr("src", url);
}

function findAddress(val) {
    var requestUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+val+"&key=AIzaSyChhpcGAq1GKr9BEmqYIF7tVnIjWYJnDRw"
    $.getJSON(requestUrl, function(data) {
       console.log(data)
       var location = data.results[0].geometry.location
       var lat = location.lat
       var lon = location.lng
        $("#minimap h2").show();
       showData(lat, lon)
    });
}

$("#locationButton").click(function() {
    var val = $("#city input").val()
    findAddress(val)
})

$("#city input").keypress(function (e) {
    if (e.which == 13) {
        var val = $(this).val().replaceAll(' ', '+')
        findAddress(val)
    }
});

