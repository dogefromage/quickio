
/** @internal */
export function clamp(x: number, lower = 0, upper = 1)
{
    if (x < lower) x = lower;
    else if (x > upper) x = upper;
    return x;
}

/** @internal */
export function lerp(a: number, b: number, t: number)
{
    return a + t * (b - a);
}

// export function hexColorToStringColor(hexColor: number)
// {
//     if (hexColor == null) return '#ff00ff';
    
//     return "#" + hexColor.toString(16).padStart(6, '0');
// }

/** @internal */
export function quickError(msg: string, throws = false)
{
    let errorMsg = `Quick error: ${msg}`;

    if (throws)
    {
        throw new Error(errorMsg);
    }
    else
    {
        console.error(errorMsg)
    }
}

/** @internal */
export function quickWarn(msg: string)
{
    let errorMsg = `Quick warning: ${msg}`;
    console.warn(errorMsg)
}

// /**
//  * @internal
//  * Checks if file is running in browser
//  * https://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
//  */
// const checkIfBrowser = new Function("try {return this===window;}catch(e){ return false;}");
// /** @internal */
// export function isBrowser()
// {
//     return checkIfBrowser();
// }

/**
 * @internal
 * @returns UTC time in seconds
 */
export function getUTCSeconds()
{
    return new Date().getTime() * 0.001;
}

/** @internal */
export function compressNumber(x: number, precision = 5)
{
    // ignore integers
    if (x % 1 === 0) return x;

    // compress
    return Number(x.toPrecision(precision));
}

/** @internal */
export class Counter
{
    constructor(
        public current = 0
    ) {}

    next()
    {
        return ++this.current;
    }
}

export const enum KeyCodes
{
    Backspace = 8,
    Tab = 9,
    Enter = 13,
    NumpadEnter = 13,
    ShiftRight = 16,
    ShiftLeft = 16,
    ControlLeft = 17,
    ControlRight = 17,
    AltLeft = 18,
    AltRight = 18,
    CapsLock = 20,
    Space = 32,
    PageUp = 33,
    PageDown = 34,
    End = 35,
    Home = 36,
    ArrowLeft = 37,
    ArrowUp = 38,
    ArrowRight = 39,
    ArrowDown = 40,
    Insert = 45,
    Delete = 46,
    Digit0 = 48,
    Digit1 = 49,
    Digit2 = 50,
    Digit3 = 51,
    Digit4 = 52,
    Digit5 = 53,
    Digit6 = 54,
    Digit7 = 55,
    Digit8 = 56,
    Digit9 = 57,
    KeyA = 65,
    KeyB = 66,
    KeyC = 67,
    KeyD = 68,
    KeyE = 69,
    KeyF = 70,
    KeyG = 71,
    KeyH = 72,
    KeyI = 73,
    KeyJ = 74,
    KeyK = 75,
    KeyL = 76,
    KeyM = 77,
    KeyN = 78,
    KeyO = 79,
    KeyP = 80,
    KeyQ = 81,
    KeyR = 82,
    KeyS = 83,
    KeyT = 84,
    KeyU = 85,
    KeyV = 86,
    KeyW = 87,
    KeyX = 88,
    KeyZ = 89,
    KeyY = 90,
    Numpad0 = 96,
    Numpad1 = 97,
    Numpad2 = 98,
    Numpad3 = 99,
    Numpad4 = 100,
    Numpad5 = 101,
    Numpad6 = 102,
    Numpad7 = 103,
    Numpad8 = 104,
    Numpad9 = 105,
    NumpadMultiply = 106,
    NumpadAdd = 107,
    NumpadSubtract = 109,
    NumpadDecimal = 110,
    NumpadDivide = 111,
    NumLock = 144,
    BracketLeft = 186,
    Comma = 188,
    Slash = 189,
    Period = 190,
    Backquote = 191,
    BracketRight = 192,
    Minus = 219,
    Quote = 220,
    Equal = 221,
    Semicolon = 222,
    Backslash = 223,
    IntlBackslash = 226,
};