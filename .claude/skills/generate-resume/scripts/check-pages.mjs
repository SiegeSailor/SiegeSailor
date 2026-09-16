import { execSync } from "node:child_process";

const SOFFICE = process.env.SOFFICE_CMD ?? "soffice --headless";

const has = (command) => {
  try {
    execSync(`command -v ${command.split(" ")[0]}`, { stdio: "ignore", shell: "/bin/bash" });
    return true;
  } catch {
    return false;
  }
};

export function checkPages(docxPath, outputDir, pageLimit = 1) {
  if (!has(SOFFICE))
    return { pdf: null, pages: null, status: "unverified",
             reason: "LibreOffice (soffice) is not on PATH, so the page count was not checked" };

  execSync(`${SOFFICE} --convert-to pdf --outdir "${outputDir}" "${docxPath}"`, { stdio: "ignore" });
  const pdf = docxPath.replace(/\.docx$/, ".pdf");

  if (!has("pdfinfo"))
    return { pdf, pages: null, status: "unverified",
             reason: "pdfinfo (poppler) is not on PATH, so the page count was not checked" };

  const pages = Number(execSync(`pdfinfo "${pdf}"`).toString().match(/^Pages:\s+(\d+)$/m)?.[1]);
  return { pdf, pages, status: pages <= pageLimit ? "ok" : "over" };
}
