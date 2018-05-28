export interface Schema {
  /**
   * The name of the component.
   */
  name: string;
  /**
   * The path to create the component.
   */
  path?: string;
  /**
   * Specifies the type of the thing
   */
  type?: string;
  [k: string]: any;
}
