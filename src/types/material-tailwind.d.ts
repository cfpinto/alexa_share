/**
 * Compatibility shim for @material-tailwind/react 2.x with @types/react 19.
 *
 * Material Tailwind's generated types `Pick` props that @types/react 19 no
 * longer declares. Missing keys in a `Pick` become required props of type
 * `unknown`, so every component errors. Re-declaring them as optional props
 * restores the React 18 shape without pinning @types/react.
 */
import "react";

declare module "react" {
	interface DOMAttributes<T> {
		onPointerEnterCapture?: PointerEventHandler<T> | undefined;
		onPointerLeaveCapture?: PointerEventHandler<T> | undefined;
		onResize?: ReactEventHandler<T> | undefined;
		onResizeCapture?: ReactEventHandler<T> | undefined;
	}

	interface HTMLAttributes<T> {
		placeholder?: string | undefined;
	}

	interface InputHTMLAttributes<T> {
		crossOrigin?: CrossOrigin;
	}
}
