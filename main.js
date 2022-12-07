SERVERURL = "https://tres3.pythonanywhere.com/";

// Get query string parameters
let urlParams = new URLSearchParams(window.location.search);
let game = urlParams.get("game");
let id = urlParams.get("id");

// Colors are implemented by hue-rotating a red card via CSS.
let colors = {
  B: 200,
  G: 150,
  R: 0,
  P: 290,
};

// Get player name + turn number
let player_name, player_turn;
$.get(`${SERVERURL}player_data?game=${game}&id=${id}`, function (data) {
  player_name = data["name"];
  player_turn = data["turn_number"];
});

let turn = 0;

let game_over = false;

// Get updates on data
let dataInterval;

function getData() {
  $.get(`${SERVERURL}data?game=${game}&id=${id}`, function (data) {
    if (data == "error: game not found") {
      /*
                This means that either the game has ended
                and is in the lobby, or the game code is incorrect.
                Either way we just ignore the message instead of erasing all
                current data.
                */
      console.log("error: game not found");
    } else {
      console.log(JSON.stringify(data));
      turn = data["turn"];
      setCards(data["player_cards"]);
      setStandings(data["num_cards"]);
      setTopcard(data["top_card"]);
      setPlayerTurnDisplay();
    }
  });
}

function getCardHTML(card, clickable) {
  // Returns HTML of given card
  // card (str): card to display
  // clickable (bool): whether card is playable (adds onclick part, and influences)
  // the image of the wildcard
  let parts = card.split("_");
  let hue = parts[0];
  let symbol = parts[1];

  let onclick;
  if (clickable) onclick = `onmousedown="playCard('${card}')"`;
  else onclick = "";

  let img_src = hue;

  if (symbol == "CANCEL") {
    symbol = "skip";
  }
  if (symbol == "REVERSE") {
    symbol = "reverse";
  }
  if (symbol == "PLUS") {
    symbol = "+2";
  }
  if (symbol == "WILD") {
    if (clickable) {
      return `<li class="d-inline mr4 js-post-tag-list-item"><div class="card, post-tag" onmousedown="showColorSelection()">wild</div></li>`;
    }
    return `<strong>wild ${img_src}</strong>`;
  }
  return `<li class="d-inline mr4 js-post-tag-list-item"><div class="card, post-tag" ${onclick}>${img_src} ${symbol}</div></li>`;
}

function setCards(cards) {
  // Clear currently displayed cards
  $("#card-grid").html("");
  // Add each card
  for (let card of cards) {
    $("#card-grid").append(getCardHTML(card, true));
  }
}

function setStandings(standings) {
  // Display standings (how many cards each player has)
  $("#standings").html("");
  for (let i = 0; i < standings.length; i++) {
    div_html = `<div class="spacer"><a><div class="answer-votes answered-accepted large">${standings[i][1]}</div></a><a class="question-hyperlink">${standings[i][0]}</a></div>`;
    $("#standings").append(div_html);

    // Check if someone has won and display winner message
    if (standings[i][1] == 0) {
      $("#win-display").css("display", "block");
      $("#winner-name").html(`${standings[i][0]} won the game!`);
      // Stop the update interval
      clearInterval(dataInterval);
      game_over = true;
      setInterval(checkIfReturn, 1000);
    }
  }
}

function setTopcard(card) {
  // Display current top card
  document.getElementById("top-card").innerHTML = getCardHTML(card, false);
}

function setPlayerTurnDisplay() {
  if (game_over) {
    return "game over";
  }
  if (turn == player_turn) {
    $("#player-turn-display").css("display", "block");
  } else {
    $("#player-turn-display").css("display", "none");
  }
}

dataInterval = setInterval(getData, 500);
getData();

// Show color selection box
function showColorSelection() {
  if (game_over) {
    return "game over";
  }
  // Check if turn is correct
  if (turn != player_turn) {
    return "not player turn";
  }
  $("#color-selection").css("display", "block");
}

// Send move requests

function playCard(card) {
  if (game_over) {
    return "game over";
  }

  // Check if turn is correct
  if (turn != player_turn) {
    return "not player turn";
  }

  // This function may be called by the color-selection section,
  // which means we need to hide it on click
  $("#color-selection").css("display", "none");

  // Send request to play card
  $.post(
    SERVERURL + "play",
    JSON.stringify({
      game: game,
      id: id,
      card: card,
    }),
    getData
  );
}

function drawCard() {
  if (game_over) {
    return "game over";
  }

  // Send request to draw card to server
  $.post(
    SERVERURL + "draw",
    JSON.stringify({
      game: game,
      id: id,
    }),
    getData
  );
}

// Return to lobby button - sends "rematch" message to server and redirects to lobby
function returnToLobby() {
  $.post(
    SERVERURL + "return",
    JSON.stringify({
      game: game,
    }),
    function (data) {
      location.href = `lobby.html?id=${id}&game=${game}`;
    }
  );
}

// Check if game has returned to lobby
function checkIfReturn() {
  $.get(SERVERURL + "lobby?game=" + game, function (data) {
    // check for game start (no means that the game has returned to lobby)
    if (data["start"] == "no") {
      location.href = `lobby.html?id=${id}&game=${game}`;
    }
  });
}
