let config = {
    apiKey: "AIzaSyDs83lnN6hSnVO09xZqEsKhSWK3nhAbRDk",
    authDomain: "getfrisk.firebaseapp.com",
    databaseURL: "https://getfrisk.firebaseio.com",
    projectId: "getfrisk",
    storageBucket: "",
    messagingSenderId: "932593743065"
};
firebase.initializeApp(config);

let database = firebase.database();


let map,
    infoWindow,
    marker,
    messageWindow,
    geoCoder;


function Marker(marker, messageWindow, address) {

    this.marker = marker;
    this.address = address;
    this.infoWindow = new google.maps.InfoWindow({
        content: address
    });
    this.messageWindow = messageWindow;
}

Marker.prototype.openWindow = function () {
    this.infoWindow.open(map, this.marker);
};


function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -97.7431, lng: 30.2672},
        zoom: 12
    });

    geoCoder = new google.maps.Geocoder();
    map.data.loadGeoJson('geo.json');
    map.data.setStyle({
        fillColor: 'transparent',
        clickable: 'true',
        strokeColor: "#ff9000",
        strokeOpacity: "0.5"
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            let pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            map.setCenter(pos);
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }

    messageWindow = new google.maps.InfoWindow({
        content: document.getElementById('message')
    });

    let existingPins = database.ref('pins');
    existingPins.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            marker = new google.maps.Marker({
                position: childSnapshot.val().latLng,
                map: map
            });

            let newMarker = new Marker(marker, messageWindow, childSnapshot.val().address);
            newMarker.marker.addListener('click', function () {
                newMarker.openWindow();
            });
        })
    });
}


function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

function pushPin(address, latLng) {
    let pins = database.ref('pins');

    let newPin = pins.push();
    newPin.set({
        'address': address,
        'latLng': latLng.toJSON()
    })
}

$("#addPin").click(function () {
    map.data.addListener('click', function (event) {
        let latLng = event.latLng;
        marker = new google.maps.Marker({
            position: latLng,
            map: map
        });

        google.maps.event.clearInstanceListeners(map.data);
        let address;

        geoCoder.geocode({
            'latLng': event.latLng
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    console.log(results[0].formatted_address);
                    address = results[0].formatted_address;
                    pushPin(address, latLng);
                    let newMarker = new Marker(marker, messageWindow, address);
                    newMarker.marker.addListener('click', function () {
                        newMarker.openWindow();
                    });
                }
            }
        });
    });
});
