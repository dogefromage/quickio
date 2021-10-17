import { ComponentState } from "..";
import { Component, ComponentClass } from "../component";
import { InputData } from "../inputChannel";

export type ComponentRow = 
{
    componentClass: ComponentClass;
    instances: Set<Component>;
    options: {}    
}

export type ComponentOptions = {
    isDefault?: boolean;
}

export type ComponentArrayItem =
    ComponentClass | [ classConstructor: ComponentClass, options: ComponentOptions ];

export type Time =
{
    /** Delta time between updates in seconds */
    dt: number;
    /** Current UTC time in seconds */
    current: number;
    /** Total time in seconds since program start */
    total: number;
    /** UTC time in seconds of start frame */
    start: number;
}

export enum EntityUpdateTypes
{
    Basic,
    Destroyed,
    OutOfSight,
};

/**
 * Test
 */
export type EntityUpdate = [ 
    id: string, 
    updateType: EntityUpdateTypes, 
    components?: [ index: number, state: ComponentState ][]
];

/**
 * This type shows the structure of the data, which is sent to every client.
 * @property ix - A unique index which increases everytime data is sent.
 * @property en - A list of {@link EntityUpdate} data. 
 */
export type ServerDataPacket =
{
    ix: number;
    en?: EntityUpdate[];
}

export type ClientDataPacket = 
{
    ix: number,
    in?: InputData,
}

export type LocalArgs = object;