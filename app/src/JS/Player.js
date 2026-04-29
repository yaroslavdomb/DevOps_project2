export default class Player {
    #name;
    #currentScore;
    #numOfPlayedMatches;
    #matchList;

    constructor(name) {
        this.#name = name;
        this.#numOfPlayedMatches = 0;
        this.#currentScore = 0;
        this.#matchList = [];
    }

    set name(name) {
        this.#name = name;
    }
    get name() {
        return this.#name;
    }

    set currentScore(currentScore) {
        this.#currentScore = currentScore;
    }
    get currentScore() {
        return this.#currentScore;
    }

    set matchList(matchList) {
        this.#matchList = matchList;
    }
    get matchList() {
        return this.#matchList;
    }

    set numOfPlayedMatches(numOfPlayedMatches) {
        this.#numOfPlayedMatches = numOfPlayedMatches;
    }
    get numOfPlayedMatches() {
        return this.#numOfPlayedMatches;
    }

    addMatch(newMatch) {
        this.#matchList.push(newMatch);
        this.#numOfPlayedMatches++;
        this.updatePlayerScore(newMatch);
    }

    updatePlayerScore(newMatch) {
        this.#currentScore += this.name === newMatch.p1Name ? newMatch.p1Points : newMatch.p2Points;
    }
}
