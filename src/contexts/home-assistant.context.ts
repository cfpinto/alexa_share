import { createContext } from "react";
import type { CompiledEntity } from "@/types/items.types";

export type ContextData = {
	entities: CompiledEntity[];
};
export const HaContext = createContext<ContextData>({ entities: [] });
