let config = {
    apiKey: "AIzaSyDs83lnN6hSnVO09xZqEsKhSWK3nhAbRDk",
    authDomain: "getfrisk.firebaseapp.com",
    databaseURL: "https://getfrisk.firebaseio.com",
    projectId: "getfrisk",
    storageBucket: "gs://getfrisk.appspot.com/",
    messagingSenderId: "932593743065"
};
firebase.initializeApp(config);

let database = firebase.database();
let storage = firebase.storage();

let map,
    infoWindow,
    marker,
    messageWindow,
    geoCoder;

function previewImage() {
    let imgPreview = document.getElementById('imgPreview');
    let file = document.getElementById('fileElement').files[0];
    let reader = new FileReader();
    $(imgPreview).attr({
        height: '50px',
        width: '50px',
        class: 'imgPreview'
    });

    reader.onloadend = function () {
        imgPreview.src = reader.result;
    };

    if (file) {
        reader.readAsDataURL(file);
    } else {
        imgPreview.src = "";
    }
}

function submitData(marker) {

    let pins = database.ref('pins');

    let pin = {
        'address': marker.getTitle(),
        'latLng': marker.getPosition().toJSON(),
        'place': $("#name").val(),
        'category': $("#type").val(),
        'description': $("#description").val()
    };

    let newPin = pins.push();
    newPin.set(pin);
    let markerImage = new Image();

    let file = document.getElementById('fileElement').files[0];
    let uploadTask = storage.ref('images/' + marker.getPosition().toString()).put(file);

    uploadTask.on('state_changed', function (snapshot) {
        let progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Progress: " + progress);

        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
        }
    }, function (error) {
        switch (error.code) {
            case 'storage/unauthorized':
                // User doesn't have permission to access the object
                break;

            case 'storage/canceled':
                // User canceled the upload
                break;

            case 'storage/unknown':
                // Unknown error occurred, inspect error.serverResponse
                break;
        }
        // Handle unsuccessful uploads
    }, function () {
        let downloadURL = uploadTask.snapshot.downloadURL;
        markerImage = new Image();
        $(markerImage).attr({
            "src": downloadURL,
            "class": 'imageViewer'
        });
    });

    infoWindow.close();

    (function (marker, pin, img) {
        google.maps.event.clearListeners(marker, 'click');
        marker.addListener('click', function (e) {
            messageWindow.setContent("<div class='pinDescriptor'><h3>" + pin.place + "</h3>" + img + "<div class=placeInfo><p>" + pin.address + "</p><p>" + pin.description + "</p><p>" + pin.category + "</p></div></div>");

            messageWindow.open(map, marker);
        })
    })(marker, pin, markerImage.prop('outerHTML'));
}

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

    infoWindow = new google.maps.InfoWindow();
    messageWindow = new google.maps.InfoWindow();


    let existingPins = database.ref('pins').orderByKey();
    existingPins.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            let markerData = childSnapshot.val();
            let getLatLng = new google.maps.LatLng(markerData.latLng);

            let genMarker = new google.maps.Marker({
                position: getLatLng,
                map: map
            });

            let markerImage = new Image();

            let imgStorage = storage.ref('images/' + getLatLng.toString());

            imgStorage.getDownloadURL().then(function (url) {
                $(markerImage).attr("src", url);
                console.log(markerImage);

                (function (marker, markerData, img) {
                    marker.addListener('click', function (e) {
                        messageWindow.setContent("<div class=pinDescriptor>" + img + "<h3>" + markerData.place + "</h3><div class=placeInfo><p>" + markerData.address + "</p><p>" + markerData.description + "</p><p>" + markerData.category + "</p></div></div>");

                        messageWindow.open(map, marker);
                    })
                })(genMarker, markerData, $(markerImage).prop('outerHTML'));
            });
        });
    });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
        'Error: The Geolocation service failed.' :
        'Error: Your browser doesn\'t support geolocation.');
    infoWindow.open(map);
}

$("#addPin").click(function () {
    map.data.addListener('click', function (event) {
        let latLng = event.latLng;
        google.maps.event.clearInstanceListeners(map.data);
        let address;

        geoCoder.geocode({
            'latLng': event.latLng
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {

                    address = results[0].formatted_address;

                    marker = new google.maps.Marker({
                        position: latLng,
                        map: map,
                        title: address
                    });

                    (function (marker, address) {
                        marker.addListener('click', function (e) {
                            infoWindow.setContent(
                                '<div id=\'form\'>' +
                                '   <div class=\'imgPreviewHolder\'>' +
                                '   <img id="imgPreview"></div>' +
                                '<div class=\'formHolder\'>' +
                                '   <h4>Address: </h4>' + address +
                                '        <table>' +
                                '            <tr>' +
                                '                <td>Name: <abbr title=\'This field is required\'>*</abbr></td>' +
                                '                <td><input type=\'text\' id=\'name\' required/></td>' +
                                '            </tr>' +
                                '            <tr>' +
                                '                <td>Description: <abbr title=\'This field is required\'>*</abbr></td>' +
                                '                <td><textarea id=\'description\' placeholder = \'(required)\' required></textarea></td>' +
                                '            </tr>' +
                                '            <tr>' +
                                '                <td>Type:</td>' +
                                '                <td><select id=\'type\'> +' +
                                '                    <option value=\'bar\' SELECTED>bar</option>' +
                                '                    <option value=\'restaurant\'>restaurant</option>' +
                                '                </select></td>' +
                                '            </tr>' +
                                '            <tr>' +
                                '                <td><input type=\'file\' style=\'display: none\' onchange=previewImage() id=\'fileElement\' accept=\'image/*\'><a href=\'#\' id=\'fileSelect\'>Select an Image (optional)</a></td>' +
                                '                <td><button onclick=\'submitData(marker)\'>Submit</button></td>' +
                                '            </tr>' +
                                '        </table>' +
                                '    </div>' +
                                '</div>'
                            );

                            infoWindow.open(map, marker);
                            let fileSelect = document.getElementById("fileSelect"),
                                fileElem = document.getElementById("fileElement");

                            fileSelect.addEventListener("click", function (e) {
                                if (fileElem) {
                                    fileElem.click();
                                }
                                e.preventDefault();
                            }, false);
                        })
                    })(marker, address);
                }
            }
        });
    });
});