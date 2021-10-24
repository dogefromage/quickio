import { ComponentState } from "./component";
import { quickError } from "./utils";

/** @internal */
export function calculateStateGradient(oldState: ComponentState, newState: ComponentState, timeDifference: number)
{
    if (oldState.length !== newState.length)
    {
        quickError(`States do not match in length`, true);
    }

    let stateGradient: ComponentState = [];

    for (let i = 0; i < oldState.length; i++)
    {
        let vOne = oldState[i];
        let vTwo = newState[i];

        if (typeof(vOne) === 'number' && typeof(vTwo) === 'number')
        {
            stateGradient.push((vTwo - vOne) / timeDifference);
        }
        else
        {
            stateGradient.push(vTwo); // in case number or boolean take newer value
        }
    }

    return stateGradient;
}

/** @internal */
export function integrateState(current: ComponentState, gradient: ComponentState, deltaTime: number)
{
    if (current.length !== gradient.length)
    {
        quickError(`States do not match in length`, true);
    }

    let newState: ComponentState = [];

    for (let i = 0; i < current.length; i++)
    {
        let val = current[i];
        let grad = gradient[i];

        if (typeof(val) === 'number' && typeof(grad) === 'number')
        {
            newState.push(val + grad * deltaTime);
        }
        else
        {
            newState.push(grad); // in case number or boolean take newer value
        }
    }

    return newState;
}