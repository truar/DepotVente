/**
 * Single source of truth for the "this control is in error" ring.
 *
 * A 2px solid destructive ring sits just outside the control's own 1px
 * destructive border, so the red edge is thick enough to spot at a glance
 * while still following the control's border radius exactly. The border width
 * itself never changes, so flipping a field to invalid never shifts the layout.
 */
export const errorRing =
  'aria-invalid:border-destructive aria-invalid:ring-destructive aria-invalid:ring-2'

/**
 * Same ring, but painted by a wrapper (an InputGroup) around the invalid
 * control it contains — the wrapper is the element that carries the rounded
 * border, so it is the one that must carry the ring.
 */
export const errorRingWithin =
  'has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-2'

/**
 * Cancels {@link errorRing} on controls whose wrapper already paints it.
 * Without this, a square-cornered ring is drawn inside the rounded wrapper
 * because the nested control is `rounded-none`.
 */
export const errorRingPaintedByWrapper =
  'aria-invalid:border-0 aria-invalid:ring-0'
