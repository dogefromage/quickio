
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
    console.error(errorMsg)
}