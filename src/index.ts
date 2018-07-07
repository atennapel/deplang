/**
 * TODO:
 *  pass through contexts
 *  if expressions
 *  nat literals
 *  equality type syntax =
 * 
 *  Unit : Type
 *  unit (t: T) : Unit
 * 
 *  Bool : Type
 *  true : Bool
 *  false : Bool
 *  boolElim : /(P : Bool -> Type) -> P true -> P false -> /(b : Bool) -> P b
 * 
 *  Nat : Type
 *  z : Nat
 *  s : Nat -> Nat
 *  natElim : /(P : Nat -> Type) -> P z -> (/(n : Nat) -> P n -> P (s n)) -> /(n : Nat) -> P n
 * 
 *  Eq : Type
 *  refl : /(t : Type) -> t -> t = t
 *  eqElim : /(P : Eq t t -> Type) -> P 
 * 
 *  List
 *  Vector
 * 
 *  eta reduction
 *  cummulative universes
 */
