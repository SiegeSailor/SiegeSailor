import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";

const SOFFICE = process.env.SOFFICE_CMD ?? "soffice --headless";

const has = (command) => {
  try {
    execSync(`command -v ${command.split(" ")[0]}`, {
      stdio: "ignore",
      shell: "/bin/bash",
    });
    return true;
  } catch {
    return false;
  }
};

export function checkPages(docxPath, outputDir, pageLimit = 1) {
  if (!has(SOFFICE))
    return {
      pdf: null,
      pages: null,
      status: "unverified",
      reason:
        "LibreOffice (soffice) is not on PATH, so the page count was not checked",
    };

  try {
    execSync(
      `${SOFFICE} --convert-to pdf --outdir "${outputDir}" "${docxPath}"`,
      { stdio: "ignore" },
    );
  } catch (error) {
    return {
      pdf: null,
      pages: null,
      status: "unverified",
      reason: `LibreOffice failed to convert the document to PDF: ${error.message}`,
    };
  }

  // soffice --outdir writes the input's basename into outputDir; deriving
  // the path from docxPath's own directory would be wrong whenever it
  // doesn't already live in outputDir.
  const pdf = join(outputDir, basename(docxPath).replace(/\.docx$/i, ".pdf"));

  if (!existsSync(pdf))
    return {
      pdf: null,
      pages: null,
      status: "unverified",
      reason: "LibreOffice reported success but produced no PDF",
    };

  if (!has("pdfinfo"))
    return {
      pdf,
      pages: null,
      status: "unverified",
      reason:
        "pdfinfo (poppler) is not on PATH, so the page count was not checked",
    };

  let output;
  try {
    // pdfinfo's field labels are locale-dependent ("Seiten:", "Páginas:", …);
    // force the C locale so "Pages:" is always what gets parsed.
    output = execSync(`pdfinfo "${pdf}"`, {
      env: { ...process.env, LC_ALL: "C" },
    }).toString();
  } catch (error) {
    return {
      pdf,
      pages: null,
      status: "unverified",
      reason: `pdfinfo failed to read the converted PDF: ${error.message}`,
    };
  }

  const match = output.match(/^Pages:\s+(\d+)$/m);
  const pages = match ? Number(match[1]) : NaN;
  if (!Number.isInteger(pages) || pages <= 0)
    return {
      pdf,
      pages: null,
      status: "unverified",
      reason: "pdfinfo output had no parsable Pages: line",
    };

  return { pdf, pages, status: pages <= pageLimit ? "ok" : "over" };
}
