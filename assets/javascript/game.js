//TODO: make non-spaghetti codes

$(document).ready(() => {
  //geterdone

  firebaseInit();
  setCommon();
  checkInitialState();
  dbListen();
  checkLocal();
  displaySwitch();
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
    state: db.ref("/state"),
    users: db.ref("/users"),

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
    },

    username: undefined,
    role: undefined
  };
  //section tag references

  window.displayRef = {};

  $("section").each(function () {
    let ref = $(this);
    window.displayRef[ref.attr("id").split("-")[0]] = ref;
  });
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
      window.local.players = {
        spectators: {
          placeholder: null
        },
        one: {
          name: null,
          sign: null,
          points: 0
        },
        two: {
          name: null,
          sign: null,
          points: 0
        }
      };
      dbRef.state.set(gameState);
      dbRef.players.spectators.set(local.players.spectators);
      dbRef.players.one.set(local.players.one);
      dbRef.players.two.set(local.players.two);
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
    window.local.players.spectators = snap.val();
  }, err => {
    console.log(err)
  });
}

//Jquery logic

function formListener() {
  //listener  & for Setup Form

  let form = $("form");
  form.submit(event => {
    event.preventDefault();
    console.log("here");
    let user = $("#username").val();
    let spectate = $("#spectate");
    if (user.length > 0) {

      //spectator case
      if ((spectate.is(":checked"))
        && Object.values(local.players.spectators).indexOf(user) > -1) {
        localStorage.username = user;
        local.username = user;
        local.role = "spectator";
        dbRef.players.spectators.push(user);
        alert(`you are ${local.username}`)
      }

      //player case
      else if (!(spectate.is(":checked"))) {
        if ((typeof local.players.one.name === "undefined"
            || typeof local.players.two.name === "undefined")
          && local.players.one.name !== user
          && local.players.two.name !== user
        ) {
          localStorage.username = user;
          local.username = user;

          //player1
          if (typeof local.players.one.name === "undefined") {
            window.local.role = "player1";
            dbRef.players.one.set({
              name: local.username,
              sign: null,
              points: 0
            })
          }

          //player 2
          else {
            window.local.role = "player2";
            dbRef.players.two.set({
              name: local.username,
              sign: null,
              points: 0
            })
          }
          alert(`you are ${local.username}: ${local.role}`);
          displaySwitch()
        }
      }

      //you did it wrong case
      else {
        alert("invalid input")
      }
    }
  })
}

function waitingAnimation(jClass) {
  //takes jquery references and changed their display settings in sequence
  // . .. ...  . .. ... <= like that

  function clearAll(elements) {
    //set all displays to none

    elements.forEach(ref => {
      ref.css("display", "none");
    });
  }

  function seperate(jClass) {
    //make array of .waiting ref

    let elements = [];
    jClass.each(function () {
      elements.push($(this));
    });
    return elements
  }

  //create array of class elements
  this.elements = seperate(jClass);
  clearAll(this.elements);
  this.i = 0;

  //set interval for loading animation
  window.waitingInterval = setInterval(() => {
    if (this.i > 2) {
      clearAll(this.elements);
      i = 0;
    }
    else {
      this.elements[i].css("display", "block");
      this.i++
    }
  }, 1000);
}

function displaySwitch() {
  //master display dispatcher
  //window construction relative to local.role and local.state.running

  $("section").fadeOut(500, () => {
    if (typeof window.local.role === "undefined") {
      window.displayRef.setup.fadeIn(500, formListener)
    }
    else {
      if (!window.local.state.running) {
        window.displayRef.waiting.fadeIn(500);
        waitingAnimation($(".waiting"));
      }
      else {
        window.displayRef.game.fadeIn(500)
      }
    }
  })
}

//misc

function checkLocal() {
  //check local storage for saved data

  function loadData() {
    //check saved username

    window.local.username = localStorage.username;
  }

  function referenceDb() {
    //check for database storage of name

    //check players
    [dbRef.players.one, dbRef.players.two].forEach(ref => {
      ref.once("value").then(snap => {
        if (snap.val() !== null) {
          if (snap.val().name === window.local.username) {
            window.local.role = "player";
          }
        }
      });
    });

    if (window.local.role !== undefined) {
      return
    }

    //check spectators
    dbRef.players.spectators.once("value").then(snap => {
      if(snap.val() !== null){
        if (Object.values(snap.val()).indexOf(window.local.username) >= -1) {
          window.local.role = "spectator";
        }
      }
    });

    if (window.local.role !== undefined) {
      return;
    }

    //if not in db reset localStorage
    localStorage.username = undefined;
    window.local.username = undefined;
  }

  //run loads if local storage value exists
  if (typeof localStorage.username !== "undefined") {
    loadData();
    referenceDb(window.local.username)
  }
}
