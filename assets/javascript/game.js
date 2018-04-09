//TODO: make non-spaghetti codes

$(document).ready(() => {
  //geterdone

  firebaseInit();
  setCommon();
  checkInitialState();
  dbListen();
});

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
    },
  };
  //local copies

  window.local = {
    spectators: {},
    state: {},

    players: {
      one: {},
      two: {},
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

  dbRef.state.on("value", snap => {
    window.local.state = snap.val();
  }, err => {
    console.log(err)
  });

  dbRef.players.one.on("value", snap => {
    window.local.players.one = snap.val();
  }, err => {
    console.log(err)
  });

  dbRef.players.two.on("value", snap => {
    window.local.players.two = snap.val();
  }, err => {
    console.log(err)
  });

  dbRef.spectators.on("child_added", snap => {
    window.local.spectators = snap.val()
  }, err => {
    console.log(err)
  });
}



