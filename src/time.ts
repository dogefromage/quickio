import { lerp } from ".";
import { getUTCSeconds } from "./utils";

export class Time
{
    private _dt;
    private _total;
    private _current;
    private _start;
    private _dtAverage;

    get dt() { return this._dt; }
    get current() { return this._current; }
    get start() { return this._start; }
    get total() { return this._total; }
    get dtAverage() { return this._dtAverage; }

    constructor(startTime = getUTCSeconds())
    {
        this._current = startTime;
        this._start = startTime;
        this._total = 0;
        this._dt = 0.05;
        this._dtAverage = 0.05;
    }

    update(timeAtUpdate = getUTCSeconds())
    {
        this._total = timeAtUpdate - this._start;
        this._dt = timeAtUpdate - this._current;
        this._current = timeAtUpdate;
        this._dtAverage = lerp(this._dtAverage, this._dt, 0.3);
    }

    copy()
    {
        let copy = new Time();

        copy._dt = this._dt;
        copy._total = this._total;
        copy._current = this._current;
        copy._start = this._start;
        copy._dtAverage = this._dtAverage;

        return copy;
    }
}