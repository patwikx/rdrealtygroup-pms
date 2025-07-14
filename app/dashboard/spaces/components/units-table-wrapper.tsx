import { getUnits } from "@/lib/data/units-get";
import { UnitsDataTable } from "./units-table";

export async function UnitsTableWrapper() {
  const units = await getUnits();
  
  return <UnitsDataTable units={units} />;
}