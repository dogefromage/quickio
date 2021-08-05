
export function lerp(min: number, max: number, parameter: number, clamp = false)
{
    if (clamp)
    {
        if (parameter > 1) parameter = 1;
        else if (parameter < 0) parameter = 0;
    }

    return min + parameter * (max - min);
}

export function inverseLerp(value: number, min: number, max: number)
{
    return (value - min) / (max - min);
}