//TODO: make non-spaghetti codes

$(document).ready(() => {
  //geterdone

  firebaseInit();
  setCommon();
  checkInitialState();
  dbListen();
  checkLocal();
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

    flags: {
      round: db.ref("/round"),
      reset: db.ref("/reset")
    },

    chat: db.ref("/chat")
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
    role: undefined,
    chat: []
  };
  //section tag references

  window.displayRef = {};

  $("section").each(function () {
    let ref = $(this);
    window.displayRef[ref.attr("id").split("-")[0]] = ref;
  });

  window.instructions = $("#instruction");
  window.chat = $("#text-here")
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
      if (window.local.state.playerCount >= 2
        && window.local.state.running === false) {
        checkReady();
      }
    }
  }, err => {
    console.log(err)
  });

  //player 1
  dbRef.players.one.on("value", snap => {
    if (snap.exists()) {
      if (local.players.one.points < snap.val().points) {
        instructions.text(
          `${snap.val().name}: +1`
        )
      }
      window.local.players.one = snap.val();
      $(".p1-username").text(snap.val().name);
    }
  }, err => {
    console.log(err)
  });

  //player 2
  dbRef.players.two.on("value", snap => {
    if (snap.exists()) {
      if (local.players.two.points < snap.val().points) {
        instructions.text(
          `${snap.val().name}: +1`
        );
      }
      window.local.players.two = snap.val();
      $(".p2-username").text(snap.val().name);
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

  db.ref("/complete").on("value", snap => {
    if (snap.exists()) {
      if (snap.val().end === true) {
        console.log("win!");
        instructions.text(`${snap.val().player}: wins. Restarting...`);
        setTimeout(hardReset, 3000)
      }
    }
  });

  //round complete

  dbRef.flags.round.on("value", snap => {
      if (snap.exists()) {
        if (snap.val().complete === true) {
          console.log("the point");
          if (local.players.one.points > 2
            || local.players.two.points > 2) {
            console.log("win?");
            if (local.players.one.points > 2) {
              db.ref("/complete").set({
                end: true,
                player: local.players.one.name
              })
            }
            else if (local.players.two.points > 2) {
              db.ref("/complete").set({
                end: true,
                player: local.players.two.name
              })

            }
          }
          else if (local.role === "player1") {
            dbRef.players.one.update({
              sign: null
            }).then(() => {
              signListener()
            });
          }
          else if (local.role === "player2") {
            dbRef.players.two.update({
              sign: null
            }).then(() => {
              signListener()
            })
          }
          dbRef.flags.round.update({
            complete: false
          }).then(() => {
            updatePoints()
          })
        }
      }
    }
  );

  //chat

  dbRef.chat.on("value", snap => {
    if (snap.exists()) {
      console.log(JSON.parse(snap.val().messages));
      local.chat = JSON.parse(snap.val().messages);
      chat.empty();
      local.chat.forEach(message => {
        let elem = $(
          `<div class='row justify-content-center' style="width: 90%"><div class="col-12"><p>`
          + `${message}`
          + `</p></div></div>`
        );
        chat.prepend(elem);
      })
    }
  });

  //dev cheatcode listener

  dbRef.flags.reset.on("value", snap => {
    if (snap.exists()) {
      if (snap.val().reset === true) {
        localStorage.clear();
        db.ref().set({});
        location.reload()
      }
    }
  })
}

function checkReady() {
  console.log("start it");
  dbRef.state.update({running: true});
  if (window.currentDisplay !== "game") {
    displaySwitch();
  }
  console.log("there")
}

//Jquery logic

function formListener() {
  //listener  & for Setup Form

  window.form = $("form");
  form.off("submit");
  form.on("submit", event => {
    event.preventDefault();
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
          && window.local.role !== "player1"
          && window.local.role !== "player2"
        ) {
          localStorage.username = user;
          local.username = user;

          if (window.local.state.playerCount < 2) {
            //player1
            if (typeof local.players.one.name === "undefined") {
              window.local.role = "player1";
              dbRef.players.one.set({
                name: local.username,
                sign: null,
                points: 0
              }).then(() => {
                window.local.state.playerCount++;
                dbRef.state.update({playerCount: local.state.playerCount})
              });
            }

            //player 2
            else if (typeof local.players.two.name === "undefined") {
              window.local.role = "player2";
              dbRef.players.two.set({
                name: local.username,
                sign: null,
                points: 0
              }).then(() => {
                window.local.state.playerCount++;
                dbRef.state.update({playerCount: local.state.playerCount})
              });
            }
          }
          displaySwitch();
        }
        else if (local.role === "player1" || local.role === "player2") {
          return;
        }
        else {
          alert("both player spots are filled")
        }
      }
      //you did it wrong case
      else {
        alert("invalid input")
      }
    }
  })
}

function signListener() {
  //listener for ingame buttons

  function resetSigns() {
    console.log("reset");
    setTimeout(function () {
      sign.css("display", "block")
      instructions.text("Pick your move!");
    }, 1500)
  }

  function hideSigns(id) {
    sign.each(function () {
      if ($(this).attr("id") !== id) {
        $(this).fadeOut(250);
      }
    })
  }

  let sign = $(".sign");
  resetSigns();
  console.log("sign listener");
  sign.off("click");
  sign.on("click", function (event) {
    let clicked = $(this);
    if (window.local.role === "player1") {
      dbRef.players.one.update(
        {sign: clicked.attr("id")}
      ).then(() => {
        window.checkSigns()
      });
    }
    else if (window.local.role === "player2") {
      dbRef.players.two.update(
        {sign: clicked.attr("id")}
      ).then(() => {
        window.checkSigns()
      });
    }
    instructions.text("Waiting...");
    hideSigns(clicked.attr("id"));
    // sign.off("click")
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
      window.displayRef.setup.fadeIn(500, formListener);
      window.currentDisplay = "setup"
    }
    else {
      if (!window.local.state.running) {
        window.displayRef.waiting.fadeIn(500);
        window.currentDisplay = "waiting"
        // waitingAnimation($(".waiting"));
      }
      else {
        window.displayRef.game.fadeIn(500);
        window.currentDisplay = "game";
        $(".strike").attr("src", "assets/images/if_check-box-outline-blank_326558.svg");
        updatePoints();
        chatListener();
        signListener();
      }
    }
  })
}

function updatePoints() {

  [local.players.one, local.players.two].forEach((obj, index) => {
    for (let i = 1; i <= obj.points; i++) {
      $(`#player${index + 1}-strike-${i}`).attr(
        "src", "assets/images/if_check-box-outline_326561.svg"
      )
    }
  });
}

function chatListener() {
  let ct = $("#chat-entry");
  let inp = $("#chat-text");
  ct.off("submit");
  ct.on("submit", (event) => {
      event.preventDefault();
      let blurb = inp.val().trim();
      let message = `${local.username}: `
        + `${blurb}`;
      local.chat.push(message);
      dbRef.chat.update({
        messages: JSON.stringify(local.chat)
      });
    }
  );
}

//misc

function checkSigns() {
  //check if both players have chosen and evaluate

  function evaluate(one, two) {
    //evaluate player picks

    function nestEvaluate(sign, win, loose, eval) {
      switch (eval) {
        case win:
          return "win";
        case loose:
          return "loose";
        case sign:
          return "tie"
      }
    }

    switch (one) {
      case "rock":
        return nestEvaluate("rock", "scissors", "paper", two);
      case "paper":
        return nestEvaluate("paper", "rock", "scissors", two);
      case "scissors":
        return nestEvaluate("scissors", "paper", "rock", two);
    }
  }

  function determineWinner(results) {
    //act appropriately

    function writeResult(local, ref) {
      ref.update({
        points: (local.points + 1)
      }).then(() => {
        dbRef.flags.round.update({
          complete: true
        });
        // signListener()
      });
    }

    switch (results) {
      case "win":
        writeResult(local.players.one, dbRef.players.one);
        break;
      case "loose":
        writeResult(local.players.two, dbRef.players.two);
        break;
      case "tie":
        dbRef.flags.round.update({
          complete: true
        });
        break;
    }
  }

  if (typeof local.players.one.sign !== "undefined"
    && typeof local.players.one.sign !== "undefined") {
    console.log("message");
    let results = evaluate(local.players.one.sign, local.players.two.sign);
    console.log(results);
    determineWinner(results);
  }
}

function checkLocal() {
  //check local storage for saved data

  function loadData() {
    //check saved username

    window.local.username = localStorage.username;
  }

  function referenceDb() {
    //check for database storage of name

    //check players
    [dbRef.players.one, dbRef.players.two].forEach((ref, index) => {
      ref.once("value").then(snap => {
        if (snap.val() !== null) {
          if (snap.val().name === window.local.username) {
            window.local.role =
              `player${index + 1}`
            ;
            displaySwitch();
          }
        }
      });
    });

    //check spectators
    dbRef.players.spectators.once("value").then(snap => {
      if (snap.val() !== null) {
        if (Object.values(snap.val()).indexOf(window.local.username) >= -1) {
          window.local.role = "spectator";
          displaySwitch();
        }
      }
    });


    //if not in db reset localStorage
    // localStorage.username = undefined;
    // window.local.username = undefined;
  }

  //run loads if local storage value exists
  if (typeof localStorage.username !== "undefined") {
    loadData();
    referenceDb()
  }
  else {
    displaySwitch()
  }
}

//dev cheatcodes

function hardReset() {
  // reset database, local, and force page reset

  dbRef.flags.reset.update({reset: true})
}
