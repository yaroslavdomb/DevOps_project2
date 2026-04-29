import Player from "./Player.js";
import Match from "./Match.js";

const possibleWinStates = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], //horizontal
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], //vertical
    [0, 4, 8],
    [2, 4, 6] //diagonals
];

const BOARD_SIZE = 9;
const POINTS_FOR_WIN = 2;
const POINTS_FOR_DRAW = 0.5;
const POINTS_FOR_LOOSE = 0;

const cellsArr = [];
const matchList = [];
const playerScoreMap = new Map();
const gameState = {
    winCombination: [],
    winnerData: null,
    firstPlayerTurn: true,
    started: false,
    p1Name: null,
    p2Name: null,
    p1Sign: null,
    p2Sign: null,
    isScoreVisible: false,
    isScoreMapSorted: false,
    isScoreTableCreated: false,
    isScoreInfoCreated: false
};

const DOM = {
    playBoard: document.querySelector(".playBoard"),
    startGameBtn: document.getElementById("startGame"),
    clearBoardBtn: document.getElementById("clearBoardBtn"),
    showStatisticBtn: document.getElementById("showStatistic"),
    sortNamesBtn: document.getElementById("sortNames"),
    sortScoresBtn: document.getElementById("sortScores"),
    player1Name: document.getElementById("player1Name"),
    player2Name: document.getElementById("player2Name"),
    player1Sign: document.getElementById("player1Sign"),
    player2Sign: document.getElementById("player2Sign"),
    statisticBlock: document.getElementById("statisticBlock"),
    clearPlayerListBtn: document.getElementById("clearPlayerList"),
    playersData: document.querySelector(".playersData")
};

function setDisabled(DOMElement, value) {
    DOMElement.disabled = value;
}

function setHidden(DOMElement, value) {
    DOMElement.hidden = value;
}

let sortedPlayerScoreMap;

//initial state once page loaded
setHidden(DOM.sortNamesBtn, true);
setHidden(DOM.sortScoresBtn, true);
setHidden(DOM.statisticBlock, true);
setDisabled(DOM.clearPlayerListBtn, true);
setDisabled(DOM.showStatisticBtn, true);
setDisabled(DOM.clearBoardBtn, true);

DOM.playBoard.addEventListener("click", function (event) {
    if (!gameState.started || gameState.winCombination.length !== 0 || event.target.innerText !== "") {
        return;
    }

    const possibleWinSign = gameState.firstPlayerTurn ? gameState.p1Sign : gameState.p2Sign;
    event.target.innerText = possibleWinSign;
    event.target.classList.add(gameState.firstPlayerTurn ? "takenByO" : "takenByX");

    if (isGameFinished(possibleWinSign)) {
        return;
    } else {
        gameState.firstPlayerTurn = !gameState.firstPlayerTurn;
        showTurnOfPlayer();
    }
});

for (let i = 0; i < BOARD_SIZE; i++) {
    const divElement = document.createElement("div");
    divElement.className = "cell";
    cellsArr[i] = divElement;
    DOM.playBoard.appendChild(divElement);
}

function getWinCombination(possibleWinSign) {
    for (const currentState of possibleWinStates) {
        if (currentState.every((i) => cellsArr[i].innerText === possibleWinSign)) {
            return currentState;
        }
    }
    return null;
}

function populateWinnerData() {
    gameState.winnerData = {};
    if (gameState.firstPlayerTurn) {
        gameState.winnerData.name = gameState.p1Name;
        gameState.winnerData.sign = gameState.p1Sign;
    } else {
        gameState.winnerData.name = gameState.p2Name;
        gameState.winnerData.sign = gameState.p2Sign;
    }
}

//no empty space to set a new values
function isBoardFull() {
    return cellsArr.every((element) => element.innerText !== "");
}

function showDrawMessage() {
    setTimeout(() => {
        alert("Friendship WON!!!");
    }, 0);
}

function markWinCombination() {
    gameState.winCombination.forEach((i) => {
        cellsArr[i].classList.add("winner");
    });
}

DOM.clearBoardBtn.addEventListener("click", clearBoard);
function clearBoard(clearAll = true) {
    for (const currentCell of cellsArr) {
        currentCell.innerText = "";
        currentCell.className = "cell";
    }
    gameState.winCombination = [];
    gameState.started = false;
    gameState.firstPlayerTurn = true;
    gameState.winnerData = null;
    if (gameState.isScoreTableCreated) {
        setDisabled(DOM.clearPlayerListBtn, false);
    }
    setDisabled(DOM.clearBoardBtn, true);

    if (clearAll) {
        DOM.player1Name.value = "";
        DOM.player1Sign.value = "X";
        DOM.player2Name.value = "";
        DOM.player2Sign.value = "O";

        enablePlayersData();
    }
}

/*
Need to set timeout as last turn blocked by alert message
Adding timeout trick allow to DOM to finish page rendering
*/
function showWinMessage() {
    setTimeout(() => {
        alert(gameState.winnerData.name + " WON with " + gameState.winnerData.sign + "!!!");
    }, 0);
}

DOM.startGameBtn.addEventListener("click", function () {
    const registrationPassed = playersRegistration();
    if (registrationPassed) {
        clearBoard(false);
        disablePlayersData();
        setDisabled(DOM.clearPlayerListBtn, true);
        setDisabled(DOM.clearBoardBtn, false);
        gameState.started = true;
        showTurnOfPlayer();
    }
});

function playersRegistration() {
    //Gathering info for first player
    let p1TempName = DOM.player1Name.value;
    if (p1TempName === null || p1TempName === undefined || p1TempName.trim() === "") {
        alert("Please provide player#1 name!");
        return false;
    }
    let p1TempSign = DOM.player1Sign.value;

    let p2TempName = DOM.player2Name.value;
    if (p2TempName === null || p2TempName === undefined || p2TempName.trim() === "") {
        alert("Please provide player#2 name!");
        return false;
    } else if (p1TempName === p2TempName) {
        alert("Same names, not good, not good");
        return false;
    }
    let p2TempSign = DOM.player2Sign.value;
    if (p1TempSign === p2TempSign) {
        alert("No-no-no, you can't play with the same sign!!!");
        return false;
    }

    gameState.p1Name = p1TempName;
    gameState.p1Sign = p1TempSign;
    if (!playerScoreMap.has(p1TempName)) {
        playerScoreMap.set(p1TempName, { name: p1TempName, score: 0 });
        gameState.isScoreMapSorted = false;
        gameState.isScoreTableCreated = false;
    }

    gameState.p2Name = p2TempName;
    gameState.p2Sign = p2TempSign;
    if (!playerScoreMap.has(p2TempName)) {
        playerScoreMap.set(p2TempName, { name: p2TempName, score: 0 });
        gameState.isScoreMapSorted = false;
        gameState.isScoreTableCreated = false;
    }

    //now there is something we can clear from the list
    setDisabled(DOM.clearPlayerListBtn, false);
    return true;
}

function enablePlayersData() {
    DOM.playersData.classList.remove("frozen");
    DOM.playersData.querySelectorAll("input, button").forEach((el) => (el.disabled = false));
}

function disablePlayersData() {
    DOM.playersData.classList.add("frozen");
    DOM.playersData.querySelectorAll("input, button").forEach((el) => (el.disabled = true));
}

function updateWinnerScore() {
    //update original table
    playerScoreMap.get(gameState.winnerData.name).score += POINTS_FOR_WIN;

    //refresh sorted map
    if (gameState.isScoreMapSorted) {
        sortedPlayerScoreMap = sortMapByScore();
    }
}

function updateDrawScore() {
    //update original table
    playerScoreMap.get(gameState.p1Name).score += POINTS_FOR_DRAW;
    playerScoreMap.get(gameState.p2Name).score += POINTS_FOR_DRAW;

    //refresh sorted map
    if (gameState.isScoreMapSorted) {
        sortedPlayerScoreMap = sortMapByScore();
    }
}

DOM.showStatisticBtn.addEventListener("click", function () {
    gameState.isScoreVisible = !gameState.isScoreVisible;
    if (gameState.isScoreVisible) {
        DOM.showStatisticBtn.innerText = "Hide statistic";
        let isTableCreated = createScoreTable();
        if (isTableCreated) {
            createScoreInfo();
            setHidden(DOM.sortNamesBtn, false);
            setHidden(DOM.sortScoresBtn, false);
        }
        setHidden(DOM.statisticBlock, false);
    } else {
        DOM.showStatisticBtn.innerText = "Show statistic";
        setHidden(DOM.sortNamesBtn, true);
        setHidden(DOM.sortScoresBtn, true);
        setHidden(DOM.statisticBlock, true);
    }
});

function createScoreTable() {
    if (gameState.isScoreTableCreated) {
        return true;
    }

    const table = document.createElement("table");
    table.border = "1";

    const scoreDataMap = gameState.isScoreMapSorted ? (sortedPlayerScoreMap ?? playerScoreMap) : playerScoreMap;

    //create headers from map
    const headerRowHead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const firstObject = scoreDataMap.values().next().value;
    if (firstObject === null || firstObject === undefined) {
        console.log("Score table is empty");
        return false;
    }
    const fieldNames = Object.keys(firstObject);
    fieldNames.forEach((element) => {
        const th = document.createElement("th");
        th.innerText = element;
        headerRow.appendChild(th);
    });
    headerRowHead.appendChild(headerRow);
    table.appendChild(headerRowHead);

    //fill the data
    const tableBody = document.createElement("tbody");
    fillTableBody(tableBody, scoreDataMap);
    table.appendChild(tableBody);

    //append BEFORE rules table
    if (gameState.isScoreInfoCreated) {
        const element = document.getElementById("rulesTable");
        DOM.statisticBlock.insertBefore(table, element);
    } else {
        DOM.statisticBlock.appendChild(table);
    }

    gameState.isScoreTableCreated = true;
    return true;
}

function fillTableBody(tableBody, dataSource) {
    dataSource.forEach((val, key) => {
        const row = document.createElement("tr");

        const tdKey = document.createElement("td");
        tdKey.innerText = key;
        row.appendChild(tdKey);

        const tdValue = document.createElement("td");
        tdValue.innerText = val.score;
        row.appendChild(tdValue);

        tableBody.appendChild(row);
    });
}

DOM.sortNamesBtn.addEventListener("click", function () {
    sortedPlayerScoreMap = new Map([...playerScoreMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));
    gameState.isScoreMapSorted = true;
    refreshScoreTable();
});

const sortScoreBtn = document.getElementById("sortScores");
sortScoreBtn.addEventListener("click", function () {
    sortedPlayerScoreMap = sortMapByScore();
    gameState.isScoreMapSorted = true;
    refreshScoreTable();
});

function sortMapByScore() {
    return new Map([...playerScoreMap.entries()].sort((a, b) => b[1].score - a[1].score));
}

DOM.clearPlayerListBtn.addEventListener("click", function () {
    if (sortedPlayerScoreMap instanceof Map) {
        sortedPlayerScoreMap.clear();
    }
    playerScoreMap.clear();
    removeScoreTable();
    setDisabled(DOM.clearPlayerListBtn, true);
    gameState.isScoreMapSorted = false;
});

function removeScoreTable() {
    DOM.statisticBlock.querySelector("table")?.remove();
    gameState.isScoreTableCreated = false;
}

function showTurnOfPlayer() {
    if (!gameState.started) {
        return;
    }

    const nextName = document.getElementById("nextTurnPlayerName");
    const nextSign = document.getElementById("nextTurnPlayerSign");

    if (gameState.firstPlayerTurn) {
        nextName.innerText = gameState.p1Name;
        nextSign.innerText = gameState.p1Sign;
    } else {
        nextName.innerText = gameState.p2Name;
        nextSign.innerText = gameState.p2Sign;
    }
}

function clearNextTurnFields() {
    const nextName = document.getElementById("nextTurnPlayerName");
    const nextSign = document.getElementById("nextTurnPlayerSign");
    nextName.innerText = "";
    nextSign.innerText = "";
}

function isGameFinished(possibleWinSign) {
    let winState = getWinCombination(possibleWinSign);
    if (winState !== null) {
        populateWinnerData();
        populateWinCombination(winState);
        markWinCombination();
        showWinMessage();
        updateWinnerScore();
        finalizeGame();
        return true;
    } else if (isBoardFull()) {
        updateDrawScore();
        showDrawMessage();
        finalizeGame();
        return true;
    }

    return false;
}

function finalizeGame() {
    updateStatistic();
    clearNextTurnFields();
    enablePlayersData();
    setDisabled(DOM.clearPlayerListBtn, false);
    setDisabled(DOM.showStatisticBtn, false);
    if (gameState.isScoreVisible) {
        refreshScoreTable();
    }
}

function printData() {
    console.log("player_1_name = " + gameState.p1Name);
    console.log("player_1_sign = " + gameState.p1Sign);
    console.log("winner combination = " + gameState.winCombination);
    console.log("firstPlayerTurn = " + gameState.firstPlayerTurn);
    console.log("started = " + gameState.started);
}

function populateWinCombination(winState) {
    gameState.winCombination = winState;
}

/*
This is static HTML code, so it's better to be created once
and used each time when need
*/
function createScoreInfo() {
    if (gameState.isScoreInfoCreated) {
        return;
    }
    const divElem = document.createElement("div");
    divElem.setAttribute("id", "rulesTable");
    const fieldsetElem = document.createElement("fieldset");
    const legendElem = document.createElement("legend");
    legendElem.innerText = "Game rules";

    const winPoints = document.createElement("label");
    winPoints.innerText = "Points for each win: " + POINTS_FOR_WIN;

    const drawPoints = document.createElement("label");
    drawPoints.innerText = "Points for each draw: " + POINTS_FOR_DRAW;

    const loosePoints = document.createElement("label");
    loosePoints.innerText = "Points for each loose: " + POINTS_FOR_LOOSE;

    fieldsetElem.appendChild(legendElem);
    fieldsetElem.appendChild(winPoints);
    fieldsetElem.appendChild(drawPoints);
    fieldsetElem.appendChild(loosePoints);
    divElem.appendChild(fieldsetElem);
    DOM.statisticBlock.appendChild(divElem);

    gameState.isScoreInfoCreated = true;
}

function updateStatistic() {
    const justFinishedMatch = populateMatchInfo();
    matchList.push(justFinishedMatch);

    const p1 = new Player(gameState.p1Name);
    p1.addMatch(justFinishedMatch);

    const p2 = new Player(gameState.p2Name);
    p2.addMatch(justFinishedMatch);
}

function populateMatchInfo() {
    let p1Points;
    let p2Points;
    if (gameState.winCombination.length === 0) {
        p1Points = POINTS_FOR_DRAW;
        p2Points = POINTS_FOR_DRAW;
    } else if (gameState.winnerData.name === gameState.p1Name) {
        p1Points = POINTS_FOR_WIN;
        p2Points = POINTS_FOR_LOOSE;
    } else {
        p1Points = POINTS_FOR_LOOSE;
        p2Points = POINTS_FOR_WIN;
    }

    return new Match(
        gameState.p1Name,
        gameState.p2Name,
        gameState.p1Sign,
        gameState.p2Sign,
        gameState.winCombination,
        p1Points,
        p2Points,
        new Date()
    );
}

function refreshScoreTable() {
    const table = DOM.statisticBlock.querySelector("table");
    if (!table) {
        return createScoreTable();
    }

    const tbody = document.createElement("tbody");
    const scoreDataMap = gameState.isScoreMapSorted ? (sortedPlayerScoreMap ?? playerScoreMap) : playerScoreMap;

    fillTableBody(tbody, scoreDataMap);

    const oldTbody = table.querySelector("tbody");
    if (oldTbody) {
        table.replaceChild(tbody, oldTbody);
    } else {
        table.appendChild(tbody);
    }
}
