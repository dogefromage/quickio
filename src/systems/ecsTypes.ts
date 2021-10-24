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

export enum EntityUpdateTypes
{
    Update,
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