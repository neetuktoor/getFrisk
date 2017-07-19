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

let $itemsGrid = $("<div id='itemsGrid' class='mdl-grid'>");

let detachedItems;

$(document).on('click', '.catHomeButton', function () {
    console.log($(this).data("category"));
    sortButton($(this).data("category"));
    detachedItems = $("#categoryCardsGrid").detach();
});

$(document).on('click', '#resetCategories', function(){
    $("#categoryGridHolder").empty().append(detachedItems);
    $("#resetCategories").prop("disabled", true);
});

$(document).on('click', '.sortButton', function(){
    console.log($(this).data("category"));
    sortButton($(this).data("category"));
    detachedItems = $("#categoryCardsGrid").detach();
});

function sortButton(category) {
    $itemsGrid.empty();
    switch (category) {
        case 'recent':
            getLatest();
            break;
        case 'rated':
            getRated();
            break;
        case 'alphabetical':
            getAlphabetical("forward");
            break;
        case 'alphabeticalReverse':
            getAlphabetical("reverse");
            break;
        default:
            getCategory(category);
    }
}

function getRated() {
    let latestRef = database.ref('pins/unsorted').orderByChild('score');
    latestRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key, "reverse");
        });
        $("#resetCategories").prop("disabled", false);
    });
}

function getAlphabetical(direction) {
    let latestRef = database.ref('pins/unsorted').orderByChild('place');
    latestRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key, direction);
        });
        $("#resetCategories").prop("disabled", false);
    });
}

function getLatest() {
    let latestRef = database.ref('pins/unsorted').limitToLast(8);
    latestRef.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key, "forward");
        });
        $("#resetCategories").prop("disabled", false);
    });
}

function getCategory(category) {
    console.log(category);
    let categoryRef = database.ref('pins/' + category);

    categoryRef.once('value', function (snapshot) {
        console.log("data");
        snapshot.forEach(function (childSnapshot) {
            genCard(childSnapshot.val(), childSnapshot.key, "forward");
        });
        $("#resetCategories").prop("disabled", false);
    });
}

function genCard(data, key, direction) {
    console.log("gen");
    let imgSource;
    let getLatLng = new google.maps.LatLng(data.latLng);

    let imgStorage = storage.ref('images/' + getLatLng.toString());

    if (data.image === "true") {
        imgStorage.getDownloadURL().then(function (url) {
            createCard(data, url, key, direction);
        })
    } else {
        imgSource = 'https://firebasestorage.googleapis.com/v0/b/getfrisk.appspot.com/o/images%2Fbutter-half-mural.jpg?alt=media&token=7517e8fc-ee5a-41f1-ae31-f61732726473';
        createCard(data, imgSource, key, direction);
    }
}

function createCard(data, url, key, direction) {
    console.log(url);

    let toAppend = ($("<div>")
        .addClass("mdl-cell mdl-cell--3-col")
        .append($("<div>")
            .addClass("demo-card-square mdl-card mdl-shadow--2dp locationCard")
            .css({
                'background-image': `url('${url}')`,
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
                        .click(function () {
                            showCardModal(data, key, url);
                        })
                        .addClass("mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect")
                        .text("Check it out!")))));
    if(direction === "forward"){
        console.log("appending");
        $itemsGrid.append(toAppend);
    } else {
        $itemsGrid.prepend(toAppend);
        console.log("prepending");
    }
    $("#categoryGridHolder").append($itemsGrid);
}

function showCardModal(data, key, img) {
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
    $("#modalImage").attr('src', `url('${img})'`);

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

function updateScore(score, key) {
    console.log(score);
    score++;
    $("#modalVotes").text(score);

    let dataScore = database.ref(`pins/unsorted/${key}/score`);

    dataScore.transaction(function (score) {
        $("#modalVotes").text();
        return score + 1;
    });
}
