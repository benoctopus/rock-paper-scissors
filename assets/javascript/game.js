//TODO: make non-spaghetti codes

$(document).ready(() => {
  //geterdone

  checkLocal()
  firebaseInit();
  setCommon();
  checkInitialState();
  dbListen();
});

//firebase Functions

function firebaseInit() {
  //firebase initialized, database shortcut = db

  firebase.initializeApp({
    apiKey: "AIzaSyAsH-cYHIaZ4Ozwnq0E--I-TMxGV1E_sog",
    authDomain: "rock-paper-scissors-44df0.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-44df0.firebaseio.com",
    projectId: "rock-paper-scissors-44df0",
    storageBucket: "rock-paper-scissors-44df0.appspot.com",
    messagingSenderId: "1008308157746"
  });

  window.db = firebase.database();
}

function setCommon() {
  //Database references

  window.dbRef = {
    spectators: db.ref("/spectators"),
    state: db.ref("/state"),

    players: {
      one: db.ref("/players/one"),
      two: db.ref("/players/two"),
      spectators: db.ref("/players/spectators")
    },
  };
  //local copies

  window.local = {
    state: {},

    players: {
      one: {},
      two: {},
      spectators: {}
    }
  };
}

function checkInitialState() {
  //ensure gameState exists

  dbRef.state.once("value").then(snap => {
    if (!snap.exists()) {
      window.gameState = {
        running: false,
        playerCount: 0,
        SpectatorCount: 0
      };
      dbRef.state.set(gameState);
    }
  }, err => {
    console.log(err)
  })
}

function dbListen() {
  //set firebase listeners for realtime sync

  //gameState
  dbRef.state.on("value", snap => {
    if (snap.exists()) {
      window.local.state = snap.val();
    }
  }, err => {
    console.log(err)
  });

  //player 1
  dbRef.players.one.on("value", snap => {
    if (snap.exists()) {
      window.local.players.one = snap.val();
      $(".p1-username").text(snap.val().name)
    }
  }, err => {
    console.log(err)
  });

  //player 2
  dbRef.players.two.on("value", snap => {
    if (snap.exists()) {
      window.local.players.two = snap.val();
      $(".p2-username").text(snap.val().name)
    }
  }, err => {
    console.log(err)
  });

  //spectators
  dbRef.players.spectators.on("value", snap => {
    window.local.players.spectators = snap.val()
  }, err => {
    console.log(err)
  });
}

//Jquery logic

function setupPage() {
  //listener  & for Setup Form

  let form = $("form");
  form.submit(event => {
    event.preventDefault();
    console.log("here");
    let user = $("#username").val();
    if (user.length > 0) {

      if (($("#spectate").is(":checked"))
        && Object.keys(local.players.spectators).indexOf(user) > -1) {
        localStorage.username = user;
        local.role = "spectator";
        let tmp = {user};
        dbRef.spectators.push(tmp);
        alert(`you are ${local.username}`)
      }
    }

    localStorage.username = user;
    local.username = user;
  })
}

function displaySwitch() {


}

//misc

function checkLocal() {
  if (typeof localStorage.username !== "undefined") {
    local.username = localStorage.username;
  }
}
