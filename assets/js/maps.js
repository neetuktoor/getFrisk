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
    markers = [],
    geoCoder;

let sidebarSelect = document.getElementById('sidebarFileSelect');
let sidebarFileElement = document.getElementById('sidebarFile');

sidebarSelect.addEventListener("click", function (e) {
    if (sidebarFileElement) {
        sidebarFileElement.click();
    }
    e.preventDefault();
}, false);


$("#sidebarSubmit").click(function (e) {
    e.preventDefault();
    let pins = database.ref('pins');
    let address = $("#sidebarAddress").val();

    let pin = {
        'address': address,
        'place': $("#sidebarPlace").val(),
        'category': $("#sidebarCategory").val(),
        'description': $("#sidebarDescription").val()
    };

    let newPin = pins.push();
    let markerImage = new Image();

    geoCoder.geocode({
        'address': address
    }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            if (results[0]) {

                let addressCoordinates = results[0].geometry.location;
                pin.latLng = addressCoordinates.toJSON();
                let sidebarMarker = new google.maps.Marker({
                    'position': addressCoordinates,
                    'map': map,
                    'animation': google.maps.Animation.DROP,
                    'title': address
                });

                markers.push({
                    'marker': sidebarMarker,
                    'address': address
                });

                if (document.getElementById('sidebarFile').value !== "") {
                    pin.image = 'true';
                    newPin.set(pin);
                    let file = document.getElementById('sidebarFile').files[0];
                    let uploadTask = storage.ref('images/' + sidebarMarker.getPosition().toString()).put(file);

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
                        $(markerImage).attr({
                            "src": downloadURL,
                            "class": 'imgPreview'
                        });
                        genPin(sidebarMarker, pin, $(markerImage).prop('outerHTML'));
                    });
                } else {
                    pin.image = 'false';
                    newPin.set(pin);
                    $(markerImage).attr({
                        "src": 'https://firebasestorage.googleapis.com/v0/b/getfrisk.appspot.com/o/images%2Fbutter-half-mural.jpg?alt=media&token=7517e8fc-ee5a-41f1-ae31-f61732726473',
                        "class": 'imgPreview'
                    });
                    genPin(sidebarMarker, pin, $(markerImage).prop('outerHTML'));
                }
            }
        }
    });
});

function previewImage() {
    let imgPreview = document.getElementById('imgPreview');
    let file = document.getElementById('fileElement').files[0];
    let reader = new FileReader();
    $(imgPreview).attr({
        'height': '50px',
        'width': '50px',
        'class': 'imgPreview'
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
        'description': $("#description").val(),
        'lastIndexTimestamp': firebase.database.ServerValue.TIMESTAMP
    };

    let newPin = pins.push();
    let markerImage = new Image();

    if (document.getElementById('fileElement').value !== "") {
        pin.image = 'true';
        newPin.set(pin);
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
            $(markerImage).attr({
                "src": downloadURL,
                "class": 'imgPreview'
            });
            genPin(marker, pin, $(markerImage).prop('outerHTML'));
        });
    } else {
        pin.image = 'false';
        newPin.set(pin);
        $(markerImage).attr({
            "src": 'https://firebasestorage.googleapis.com/v0/b/getfrisk.appspot.com/o/images%2Fbutter-half-mural.jpg?alt=media&token=7517e8fc-ee5a-41f1-ae31-f61732726473',
            "class": 'imgPreview'
        });
        genPin(marker, pin, $(markerImage).prop('outerHTML'));
    }
    infoWindow.close();
}


function genPin(marker, pin, img) {
    google.maps.event.clearListeners(marker, 'click');
    let content = "<div class='iw-container'>" +
        "<div class='iw-title'>" + pin.place + "</div>" +
        "<div class='iw-content'>" + img +
        "<div class='iw-subTitle'>Address: </div>" + pin.address + "<br>" +
        "<div class='iw-subTitle'>Description: </div>" + pin.description + "<br>" +
        "<div class='iw-subTitle'>Category:</div> " + pin.category +
        "<br></div><div class='iw-bottom-gradient'></div></div>";
    marker.addListener('click', function (e) {
        messageWindow.setContent(content);
        google.maps.event.addListener(messageWindow, 'domready', function () {
            setWindowStyle();
        });

        messageWindow.open(map, marker);
    })
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -97.7431, lng: 30.2672},
        zoom: 12
    });

    geoCoder = new google.maps.Geocoder();
    map.data.loadGeoJson('geo.json');
    map.data.setStyle({
        'fillColor': 'transparent',
        'clickable': 'true',
        'strokeColor': "#ff9000",
        'strokeOpacity': "0.5"
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            let pos = {
                'lat': position.coords.latitude,
                'lng': position.coords.longitude,
            };

            map.setCenter(pos);

            let currPositionMarker = new google.maps.Marker({
                'position': pos,
                'map': map,
                'icon': 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                'animation': google.maps.Animation.DROP
            });


        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }

    infoWindow = new google.maps.InfoWindow({
        maxWidth: 350
    });
    messageWindow = new google.maps.InfoWindow({
        maxWidth: 350
    });

    let existingPins = database.ref('pins').orderByKey();
    existingPins.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            let markerData = childSnapshot.val();
            let getLatLng = new google.maps.LatLng(markerData.latLng);

            let genMarker = new google.maps.Marker({
                'position': getLatLng,
                'title': markerData.address,
                'animation': google.maps.Animation.DROP,
                'map': map
            });

            markers.push({
                'marker': genMarker,
                'address': markerData.address
            });

            let markerImage = new Image();

            let imgStorage = storage.ref('images/' + getLatLng.toString());

            if (markerData.image === "true") {
                imgStorage.getDownloadURL().then(function (url) {
                    $(markerImage).attr({
                        'src': url,
                        'class': 'imgPreview'
                    });
                    console.log(markerImage);

                    genPin(genMarker, markerData, $(markerImage).prop('outerHTML'));

                })
            } else {
                $(markerImage).attr({
                    'src': 'https://firebasestorage.googleapis.com/v0/b/getfrisk.appspot.com/o/images%2Fbutter-half-mural.jpg?alt=media&token=7517e8fc-ee5a-41f1-ae31-f61732726473',
                    'class': 'imgPreview'
                });
                genPin(genMarker, markerData, $(markerImage).prop('outerHTML'));
            }
        });
    });
}

function setWindowStyle() {
    // Reference to the DIV that wraps the bottom of infowindow
    let iwOuter = $('.gm-style-iw');
    iwOuter.children(':nth-child(1)').css({'width': '350px'});

    let iwBackground = iwOuter.prev();

    iwBackground.children(':nth-child(2)').css({'display': 'none'});

    iwBackground.children(':nth-child(4)').css({'display': 'none'});

    iwBackground.children(':nth-child(4)').css({'display': 'none'});

    iwBackground.children(':nth-child(3)').find('div').children().css({
        'box-shadow': 'rgba(72, 181, 233, 0.6) 0px 1px 6px',
        'z-index': '1'
    });

    let iwCloseBtn = iwOuter.next();

    iwCloseBtn.css({
        opacity: '1',
        right: '38px',
        top: '3px',
        border: '7px solid #48b5e9',
        'border-radius': '13px',
        'box-shadow': '0 0 5px #3990B9'
    });

    if ($('.iw-content').height() < 140) {
        $('.iw-bottom-gradient').css({display: 'none'});
    }

    iwCloseBtn.mouseout(function () {
        $(this).css({opacity: '1'});
    });
}

$("#search").click(function () {
    let searchQuery = $("#categorySearch").val();

    if(searchQuery === "All"){
        setMapOnAll(map);
        return;
    }

    let searchQueryRef = database.ref('search/queries');

    setMapOnAll(null);

    let searchRef = searchQueryRef.push(searchQuery);

    setTimeout(function(){
        let searchResults = database.ref('search/results/' + searchRef.key);
        searchResults.on('value', function (snapshot) {
            console.log(snapshot.val());
            let pinRef = snapshot.val().hits;
            console.log(pinRef);

            for(let i=0; i < pinRef.length; i++){
                let getPinLatLng = database.ref('pins/' + pinRef[i].objectID);

                getPinLatLng.once('value', function(snapshot){
                    for(let j=0; j<markers.length; j++){
                        if(snapshot.val().address === markers[j].address){
                            markers[j].marker.setMap(map);
                        }
                    }
                });
            }
        })
    }, 2000);
});

function setMapOnAll(map) {
    for (let i = 0; i < markers.length; i++) {
        markers[i].marker.setMap(map);
    }
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
                        'position': latLng,
                        'map': map,
                        'title': address,
                        'animation': google.maps.Animation.DROP
                    });

                    markers.push({
                        'marker': marker,
                        'address': address
                    });

                    (function (marker, address) {
                        marker.addListener('click', function (e) {
                            infoWindow.setContent(
                                '<div id=\'form\' class=\'iw-container\'>' +
                                '   <div class=\'iw-title\'>Add a place!</div>' +
                                '   <div class=\'iw-content\'>' +
                                '   <img id="imgPreview">' +
                                '<div class=\'iw-subTitle\'>Marker Address:</div>' + address +
                                '<div class=\'formHolder\'>' +
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
                                '</div>' +
                                '</div>'
                            );

                            google.maps.event.addListener(infoWindow, 'domready', function () {
                                setWindowStyle();
                            });

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