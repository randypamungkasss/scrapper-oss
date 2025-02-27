import puppeteer from "puppeteer";
import { Parser } from "json2csv";

// Config :
const URL = "http://localhost:5500/data_10k.html";

// Script :
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(URL);

  const tableData = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("tr"));
    return rows
      .map((row, index) => {
        const columns = Array.from(row.querySelectorAll("td"));
        const rowData: { [key: string]: string } = {};
        columns.forEach((column) => {
          const header = column.className.split(" ")[0];
          if (
            ["column_C_ID_TICKET", "column_C_REPORTED_DATE", "column_C_SUMMARY", "column_C_WITEL", "column_C_WORK_ZONE", "column_C_PERANGKAT"].includes(header)
          ) {
            if (column.querySelector('input[type="checkbox"]')) {
              const checkbox = column.querySelector('input[type="checkbox"]');
              rowData[header] = checkbox ? (checkbox as HTMLInputElement).value : "";
            } else {
              rowData[header] = column.textContent ? column.textContent.trim() : "";
            }
          }
        });

        return rowData;
      })
      .filter((row) => Object.keys(row).length > 0);
  });

  const fields = ["column_C_ID_TICKET", "column_C_REPORTED_DATE", "column_C_SUMMARY", "column_C_WITEL", "column_C_WORK_ZONE", "column_C_PERANGKAT"];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(tableData);

  Bun.write("results/tableData.csv", csv);
  console.log("Write tableData.csv success!");

  await browser.close();
})();
