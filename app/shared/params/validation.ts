/**
 * This type is generic and takes a validated schema as a parameter. Using
 * the interface of the validated interface, it defines a optionally present
 * key which can have any value. Since this type is for input validation, each
 * field is annotated as readonly
 *
 * @example
 *
 * // If our desired input schema was:
 * interface NewUserParams {
 *   name: string,
 *   age:  number,
 *   createdAt: Date
 * }
 *
 * // `TUnvalidated<NewUserParams>` would be equivalent to
 *
 * interface UnvalidatedUserParams {
 *   readonly name?: any,
 *   readonly age?: any,
 *   readonly createdAt?: Date
 * }
 */
export type TUnvalidated<ValidatedSchema> = {
  readonly [Key in keyof ValidatedSchema]?: any
}
