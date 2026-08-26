import path from "path";
import { syncExcelToDatabase } from "../src/lib/excel-data";

async function main() {
  const filePath = process.env.EXCEL_PATH || path.join(process.cwd(), "data", "Summary.xlsx");
  console.log(`Importing from ${filePath}...`);
  const res = await syncExcelToDatabase(filePath);
  console.log("Sync result:", res);
}

main()
  .catch((e) => {
    console.error("Error seeding from excel:", e);
    process.exit(1);
  });
