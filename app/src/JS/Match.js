export default class Match {
    #p1Name;
    #p2Name;
    #p1Sign;
    #p2Sign;
    #p1Points;
    #p2Points;
    #winState; //array [x,y,z], where each component is number of element on gameboard
    #date; //date & time of match between p1 and p2

    constructor(p1name, p2name, p1sign, p2sign, winState, p1Points, p2Points, date = new Date()) {
        this.#p1Name = p1name;
        this.#p2Name = p2name;
        this.#p1Sign = p1sign;
        this.#p2Sign = p2sign;
        this.#p1Points = p1Points;
        this.#p2Points = p2Points;
        this.#winState = winState;
        this.#date = date;
    }

    set p1Name(p1Name) {
        this.#p1Name = p1Name;
    }
    get p1Name() {
        return this.#p1Name;
    }

    set p2Name(p2Name) {
        this.#p2Name = p2Name;
    }
    get p2Name() {
        return this.#p2Name;
    }

    set p1Sign(p1Sign) {
        this.#p1Sign = p1Sign;
    }
    get p1Sign() {
        return this.#p1Sign;
    }

    set p2Sign(p2Sign) {
        this.#p2Sign = p2Sign;
    }
    get p2Sign() {
        return this.#p2Sign;
    }

    set winState(winState) {
        this.#winState = winState;
    }
    get winState() {
        return this.#winState;
    }

    set p1Points(p1Points) {
        this.#p1Points = p1Points;
    }
    get p1Points() {
        return this.#p1Points;
    }

    set p2Points(p2Points) {
        this.#p2Points = p2Points;
    }
    get p2Points() {
        return this.#p2Points;
    }

    set date(date) {
        this.#date = date;
    }
    get date() {
        return this.#date;
    }
}
