
export class EventHandler
{
    private callbacks = new Map<string, ((eventData: any) => void)[]>();

    addEventListener(eventName: string, callback: (eventData: any) => void)
    {
        debugger

        let entry = this.callbacks.get(eventName);
        if (entry === undefined)
        {
            entry = [];
            this.callbacks.set(eventName, entry);
        }

        entry.push(callback);
    }

    removeEventListener(eventName: string, callback: (eventData: any) => void)
    {
        debugger

        let entry = this.callbacks.get(eventName);
        if (entry !== undefined)
        {
            entry = entry.filter((el) => el != callback);
            this.callbacks.set(eventName, entry);
        }
    }

    dispatchEvent(eventName: string, data: any)
    {
        debugger

        let entry = this.callbacks.get(eventName);
        if (entry !== undefined)
        {
            for (let callback of entry)
            {
                callback(data);
            }
        }
    }
}
