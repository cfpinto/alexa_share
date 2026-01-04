import { useContext } from "react";
import { HaContext } from "@/contexts/home-assistant.context";

export const useEntities = () => {
	const { entities } = useContext(HaContext);

	return entities;
};
