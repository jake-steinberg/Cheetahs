//create the Leaflet map
//declare map var in global scope
var map;
//create a global scope array to populate in the calcStats function
var dataStats = {};  
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        //map parameters
        center: [20, 40],
        zoom: 4,
        maxZoom: 7,
        minZoom: 4,
        //needed to get rid zoom in order to move it 
        zoomControl:false,
        //constrain pan to data
        maxBounds: [
            [65, -40],
            [-50, 120]
            ]
    });
    //adds zoom buttons back to top right
    L.control.zoom({position:'topright'}).addTo(map);

    //add the basemap.
    var CartoDB_DarkMatterNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
	    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	    subdomains: 'abcd',
    }).addTo(map);

    //call getData function
    getData();
};

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

function calcStats(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 2010; year <= 2019; year+=1){
              //get population for current year
              //important to use Number method to prevent array properties from being read as string
              var value = Number(city.properties[year]);
              //add value to array
              if (value > 0){
                  allValues.push(value);
              }
        }
    }
    //get min, max, mean stats for our array
    //manually set 1 as min to avoid dividing by 0 in the calcPropRadius function
    dataStats.min = 1
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b;});
    //console.log(sum)
    dataStats.mean = sum/allValues.length;
}    

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //conditional if attValue is greater than 0, do the function. If it is zero, return zero.
    if (attValue === 0){
        return 0;
    } else {
        //constant factor adjusts symbol sizes evenly
        var minRadius = 4;
        //Flannery Apperance Compensation formula, with minValue manually set to 1 to avoid dividing by 0.
        var radius = Math.round(1.0083 * Math.pow(attValue/1,0.5715) * minRadius)

        return radius;
    }
};

function popUpContent(properties, attribute){
    this.properties = properties;
    this.attribute = attribute;
    this.year = attribute.split("_")[1];
    this.cheetahs = this.properties[attribute] ? this.properties[attribute]: 0;
    this.formatted  = "<p><b>City:</b> " + properties.City + ", " + properties.Country + "</p><p><b>" + "Number of cheetahs" + ":</b> " + this.cheetahs + "</p>";
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
     //assign the current attribute based on the first index of the attributes array
     var attribute = attributes[0];
    
    //create marker options
    //sort data into two colors based on status
    if (feature.properties[attributes[12]] === 'O'){
        var options = {
            fillColor: "#ffb703",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        }} else {
        var options = {
            fillColor: "#219ebc",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7
        }}
        //make the symbols for the markers without values invisible
        if (feature.properties[attribute] == 0){
            options.fillOpacity =0;
            options.opacity = 0;
        }

    //for each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

        //create circle marker layer   
        var layer = L.circleMarker(latlng, options);
        
        //create new popup content
        var popupContent = new popUpContent(feature.properties, attribute);

        //bind the popup to the circle marker    
        layer.bindPopup(popupContent.formatted, { 
            offset: new L.Point(0,-options.radius)
        });

        //return the circle marker to the L.geoJson pointToLayer option
        return layer;
    };

//add circle markers for point features to the map
function createPropSymbols(data, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

//add the cheetah range layer to the map
function loadRange(data){
     //create a Leaflet GeoJSON layer and add it to the map
     L.geoJson(data, {
        fillColor: "#ffb703",
        color: "#000",
        weight: 0,
        opacity: 1,
        fillOpacity: 0.2,
        //this is important to prevent the cursor from changing on hover
        interactive: false
     }).addTo(map);

};

function setZeroValue(layer, attribute){
    if (layer.feature.properties[attribute] == 0){
        layer.setStyle({
            fillOpacity:0,
            opacity:0
        })
    }
    else{
        layer.setStyle({
            fillOpacity:0.7,
            opacity:1
        })
    }
}

//resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    //update temporal legend
    document.querySelector("span.year").innerHTML = attribute;
    map.eachLayer(function(layer){
        //makes sure there is a value
        if (layer.feature){
            if (layer.feature.properties.City){
            //access feature properties
            var props = layer.feature.properties;

            //update each feature's radius based on new attribute values
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            setZeroValue(layer, attribute)

            //add city to popup content string
            var popupContent = new popUpContent(props, attribute);

            //update popup with new content    
            popup = layer.getPopup();    
            popup.setContent(popupContent.formatted).update();
            }
        };
    });
};

//create new sequence controls
function createSequenceControls(attributes){   
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
    
        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/noun-backward.png"></button>'); 
            
            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/noun-forward.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });

    //this actually adds it to the map
    map.addControl(new SequenceControl());
    
    //set slider attributes
    document.querySelector(".range-slider").max = 9;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            
            //increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //if past the last attribute, wrap around to first attribute
                index = index > 9 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //if past the first attribute, wrap around to last attribute
                index = index < 0 ? 9 : index;
            };

            //update slider
            document.querySelector('.range-slider').value = index;
            //pass new attribute to update symbols
            updatePropSymbols(attributes[index]);
        })
    })
    
    //input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        //get the new index value
        var index = this.value;
        //pass new attribute to update symbols
        updatePropSymbols(attributes[index]);
    });

};

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright',
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = '<p class="temporalLegend">Cheetahs reported in <span class="year">2010</span></p>';

            //start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="150px" height="130px">';

            //array of circle names to base loop on
            var circles = ["max", "mean", "min"];

            //manually set the stats from calcStats to make the circles look better
            dataStats.mean = 25
            dataStats.max = 60
            dataStats.min = 5

            //loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                //assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 120 - radius;  
                //circle string
                svg +=
                '<circle class="legend-circle" id="' +
                circles[i] +
                '" r="' +
                radius +
                '"cy="' +
                cy +
                '" fill="#fffff" fill-opacity="0" stroke="#000000" cx="60"/>';
                //evenly space out labels            
                var textY = i * 25 + 60;        
                //text string            
                svg += '<text id="' + circles[i] + '-text" x="120" y="' + textY + '">' + Math.round(dataStats[circles[i]]*100)/100 + '</text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);

            return container;
        }
    });
    map.addControl(new LegendControl());
};

function secondLegend() {
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-status');
            
            //legend title
            container.innerHTML = '<p class="statusLegend">Cheetahs</span></p>';
        //Create origin svg
            //start attribute legend svg string
            var originSvg = '<svg id="origin-legend" width="120px" height="50px">';

            //circle string
            originSvg +=  '<circle cx="70" cy="34" r="15" stroke="black" stroke-width="1" fill="#ffb703" />'

            //close svg string
            originSvg += "</svg>";

            //text string            
            originSvg += '<text id="origin-text" x="100" y="100"><br>Taken from the wild and reported on the black market<br></text>';
        //Create destination svg
            //start attribute legend svg string
            var destSvg = '<svg id="dest-legend" width="120px" height="50px">';

            //circle string
            destSvg +=  '<circle cx="70" cy="34" r="15" stroke="black" stroke-width="1" fill="#219ebc" />'

            //close svg string
            destSvg += "</svg>";

            //text string            
            destSvg += '<text id="dest-text" x="100" y="100"><br>In transit or under illegal ownership<br></text>';
        //Create range svg
            //start attribute legend svg string
            var rangeSvg = '<svg id="range-legend" width="120px" height="50px">';

            //rectangle string
            rangeSvg += '<rect x="55" y="19" width="30px" height="30px" stroke="black" stroke-width="1" fill="#6D530D" />'

            //close svg string
            rangeSvg += "</svg>";

            //text string            
            rangeSvg += '<text id="range-text" x="100" y="100"><br>Range in the wild<br></text>';

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend', originSvg);
            container.insertAdjacentHTML('beforeend', destSvg);
            container.insertAdjacentHTML('beforeend', rangeSvg)

            return container;
            }
    });
    map.addControl(new LegendControl());
};

//build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        attributes.push(attribute);
        };

    return attributes;
};

//function to retrieve the data and place it on the map
function getData(){
    //adds the cheetah range layer
    fetch("data/cheetah_range.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            loadRange(json)
    });
    //load the cheetah data
    fetch("data/cheetah_data.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
           var attributes = processData(json);
           //calculate the min, max and mean for creating the legend circles
           calcStats(json);  
           //create the proportional symbols
           createPropSymbols(json, attributes);
           //create the sequence control and update the proportional symbols
           createSequenceControls(attributes);
           //create the temporal legend
           createLegend(attributes)
           //create the other legend
           secondLegend()
    });       
};

document.addEventListener('DOMContentLoaded',createMap)