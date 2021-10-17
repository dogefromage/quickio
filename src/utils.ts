
/** @internal */
export function clamp(x: number, lower = 0, upper = 1)
{
    if (x < lower) x = lower;
    else if (x > upper) x = upper;
    return x;
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

/**
 * @internal
 * Checks if file is running in browser
 * https://stackoverflow.com/questions/17575790/environment-detection-node-js-or-browser
 */
const checkIfBrowser = new Function("try {return this===window;}catch(e){ return false;}");
export function isBrowser()
{
    return checkIfBrowser();
}

/**
 * @returns UTC time in seconds
 */
export function getUTCSeconds()
{
    return new Date().getTime() * 0.001;
}

export function compressNumber(x: number, precision = 5)
{
    // ignore integers
    if (x % 1 === 0) return x;

    // compress
    return Number(x.toPrecision(precision));
}

export function* createCounter()
{
    let i = 0;
    while (true)
    {
        yield i++;
    }
}