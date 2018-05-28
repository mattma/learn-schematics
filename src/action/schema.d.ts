export interface Schema {
    /**
     * The name of the component.
     */
    name: string;
    /**
     * The path to create the component.
     */
    path?: string;
    [k: string]: any;
}
