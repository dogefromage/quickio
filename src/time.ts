import { lerp } from ".";
import { getUTCSeconds } from "./utils";

/**
 * Use this class only inside of components, where it is passed using {@link ComponentMethodParams}.
 * 
 * ```ts
 * // time difference in seconds between this and last frame (stands for deltaTime)
 * time.dt;
 * 
 * // a rolling average of time.dt to avoid unwanted spikes
 * time.dtAverage;
 * 
 * // the current time in UTC seconds
 * time.current;
 * 
 * // the start time in UTC seconds
 * time.start;
 * 
 * // the total time in seconds since the start of the program
 * time.total;
 * 
 * // the last update time in UTC seconds
 * time.last;
 * ```
 */
export class Time
{
    /** @internal */
    private _dt;
    /** @internal */
    private _total;
    /** @internal */
    private _current;
    /** @internal */
    private _start;
    /** @internal */
    private _dtAverage;
    /** @internal */
    private _last;

    get dt() { return this._dt; }
    get current() { return this._current; }
    get start() { return this._start; }
    get total() { return this._total; }
    get dtAverage() { return this._dtAverage; }
    get last() { return this._last; }

    constructor(startTime = getUTCSeconds())
    {
        this._current = startTime;
        this._start = startTime;
        this._total = 0;
        this._dt = 0.05;
        this._dtAverage = 0.05;
        this.__last = 0;
    }

    update(timeAtUpdate = getUTCSeconds())
    {
        if (timeAtUpdate < this._current) quickError(`New time cannot be older than current time`);

        this._last = this._current;
        this._current = timeAtUpdate;
        this._dt = this._current - this._last;
        this._total = this._current - this._start;
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
        copy._last = this._last;

        return copy;
    }
}