import { useContext } from "react";
import { HaContext } from "@/contexts/home-assistant.context";

export const useEntities = () => {
	const { entities, reload } = useContext(HaContext);

	return { entities, reload };
};
