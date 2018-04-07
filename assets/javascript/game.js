//TODO: make non-spaghetti codes

$(document).ready(() => {
  firebaseInit();
  setCommon();
  checkInitialState();
  dbListen()
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

  window.dbRef = {
    state: db.ref("/state"),
    players: db.ref("/players"),
    spectators: db.ref("/spectators")
  };

  window.gameState = {};
  window.players = {};
  window.spectators = {};
  window.clientType = undefined;
  window.username = undefined;
}

function checkInitialState() {

  dbRef.state.once("value").then(snap => {
    if (!(snap.exists())) {
      window.gameState = {
        running: false,
        playerCount: 0,
        SpectatorCount: 0
      };
      dbRef.state.set(gameState);
    }
    else {
      window.gameState = snap.val()
    }
  }, (err) => {console.log(err)});
}

function dbListen() {

  dbRef.state.on("value", snap => {
    window.gameState = snap.val()
  })
}



