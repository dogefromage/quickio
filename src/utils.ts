

export function clamp(x: number, lower = 0, upper = 1)
{
    if (x < lower) x = lower;
    else if (x > upper) x = upper;
    return x;
}

export function hexColorToStringColor(hexColor: number)
{
    if (hexColor == null) return '#ff00ff';
    
    return "#" + hexColor.toString(16).padStart(6, '0');
}