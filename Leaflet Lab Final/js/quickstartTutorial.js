// L.map and L.setView = initialize the map on the "map" div with a given center and zoom
var map = L.map('map').setView([51.505, -0.09], 13);

// L.tilelayer = Used to load and display tile layers on the map. Note that most tile servers require attribution, which you can set under Layer. Extends GridLayer.
// L.addto = Adds a new Handler to the given map with the given name.
var Stamen_Watercolor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
}).addTo(map);

// L.marker = used to display clickable/draggable icons on the map. Extends Layer.
var marker = L.marker([51.5, -0.09]).addTo(map);

// L.circle = A class for drawing circle overlays on a map. Extends CircleMarker. It's an approximation and starts to diverge from a real circle closer to poles (due to projection distortion).
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(map);

// L.polygon = A class for drawing polygon overlays on a map. Extends Polyline. Note that points you pass when creating a polygon shouldn't have an additional last point equal to the first one — it's better to filter out such points.
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(map);

// L.bindPopup and L.popup = Used to open popups in certain places of the map.
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

var popup = L.popup();


function onMapClick(e) {
    popup
        // L.setLatLng = Changes the marker position to the given point.
        .setLatLng(e.latlng)
        // L.setContent = Sets the HTML content of the popup.
        .setContent("You clicked the map at " + e.latlng.toString())
        // L.openOn = Adds the popup to the map and closes the previous one. 
        .openOn(map);
}

// map.on = A set of methods shared between event-powered classes (like Map and Marker). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire 'click' event).
map.on('click', onMapClick);
