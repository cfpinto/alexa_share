import { createContext } from "react";
import type { CompiledEntity } from "@/types/items.types";

export type ContextData = {
	entities: CompiledEntity[];
	reload: () => void;
};
export const HaContext = createContext<ContextData>({
	entities: [],
	reload: () => {},
});
