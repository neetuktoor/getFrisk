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

let $itemsGrid = $("#itemsGrid");

$(document).ready(function(){
    $(".categoryButton").click(function(){
        sortButton($(this).text().trim());
    });
});

function sortButton(category){
    $itemsGrid.empty();
    switch(category){
        case 'Recently Added':
            getLatest();
            break;
        case 'Highest Rated':
            getRated();
            break;
        case 'Alphabetical':
            getAlphabetical();
            break;
        default:
            getCategory(category);
    }
}

function getRated(){
    let latestRef = database.ref('pins/unsorted').orderByChild('score').limitToLast(4);
    latestRef.once('value', function(snapshot){
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key);
        });
    });
}

function getAlphabetical(){
    let latestRef = database.ref('pins/unsorted').orderByChild('place');
    latestRef.once('value', function(snapshot){
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key);
        });
    });
}

function getLatest(){
    let latestRef = database.ref('pins/unsorted').orderByKey().limitToFirst(4);
    latestRef.once('value', function(snapshot){
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key);
        });
    });
}

function getCategory(category){
    let categoryRef = database.ref('pins/categorySort' + category).orderByKey().limitToFirst(4);

   categoryRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key);
        });
    });
}

function genCard(data, key) {
     let imgSource;
     let getLatLng = new google.maps.LatLng(data.latLng);

     let imgStorage = storage.ref('images/' + getLatLng.toString());

     if(data.image === "true"){
         imgStorage.getDownloadURL().then(function(url){
             createCard(data, url, key);
         })
     } else {
         imgSource='https://firebasestorage.googleapis.com/v0/b/getfrisk.appspot.com/o/images%2Fbutter-half-mural.jpg?alt=media&token=7517e8fc-ee5a-41f1-ae31-f61732726473';
         createCard(data, imgSource, key);
     }
}

function createCard(data, url, key){
    console.log(url);
    $itemsGrid.append($("<div>")
        .addClass("mdl-cell mdl-cell--3-col")
        .append($("<div>")
            .addClass("demo-card-square mdl-card mdl-shadow--2dp locationCard")
            .css({
                'background-image' : `url('${url}')`,
                "background-size": "cover"
            })
            .append($("<div>")
                    .addClass("mdl-card__title mdl-card--expand").append($("<h2>")
                        .addClass("mdl-card__title-text")
                        .text(data.place))
                , $("<div>")
                    .addClass("mdl-card__supporting-text")
                    .text(data.description)
                , $("<div>")
                    .addClass("mdl-card__actions mdl-card--border")
                    .append($("<a>")
                        .click(function(){
                            showCardModal(data, key)
                        })
                        .addClass("mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect")
                        .text("Check it out!")))));
}

function showCardModal(data, key) {
    let dialog = document.querySelector('dialog');
    dialogPolyfill.registerDialog(dialog);
    let smallPosition = new google.maps.LatLng(data.latLng);

    let smallMap = new google.maps.Map(document.getElementById('smallMap'), {
        zoom: 12
    });

    google.maps.event.addListenerOnce(smallMap, 'idle', function () {
        smallMap.setCenter(smallPosition);
        let placeMarker = new google.maps.Marker({
            'position': smallPosition,
            'map': smallMap,
            'icon': 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            'animation': google.maps.Animation.DROP
        });
    });

    $("#modalAddress").text(data.address);
    $("#modalDescription").text(data.description);
    $("#modalPlace").text(data.place);
    $("#modalVotes").text(data.score);

    dialog.showModal();

    google.maps.event.trigger(smallMap, "resize");

    $(".close").click(function () {
        if (dialog.open) {
            dialog.close();
        }
    });

    $("#modalUpvote").click(function () {
        updateScore(parseInt($("#modalVotes").text()), key);
        $("#modalUpvote").off('click');
    });
}

function updateScore(score, key){
    console.log(score);
    score++;
    $("#modalVotes").text(score);

    let dataScore = database.ref(`pins/unsorted/${key}/score`);

    dataScore.transaction(function(score){
        $("#modalVotes").text();
        return score +1;
    });
}
