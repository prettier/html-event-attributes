import fs from "node:fs/promises";
import * as cheerio from "cheerio";
import { outdent } from "outdent";

const CACHE_DIRECTORY = new URL("../.cache/", import.meta.url);

const getText = async (url) => {
  const cacheFile = new URL(
    url.replaceAll(/[^a-zA-Z\d\.]/g, "-"),
    CACHE_DIRECTORY,
  );

  let stat;

  try {
    stat = await fs.stat(cacheFile);
  } catch {}

  if (stat) {
    if (Date.now() - stat.mtimeMs < /* 10 hours */ 10 * 60 * 60 * 1000) {
      return fs.readFile(cacheFile, "utf8");
    }

    await fs.rm(cacheFile);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Fetch '${url}' failed.`);
  }

  const text = await response.text();

  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });
  await fs.writeFile(cacheFile, text);

  return text;
};

const text = await getText(
  "https://html.spec.whatwg.org/multipage/indices.html",
);
const $ = cheerio.load(text);
const names = [
  // https://html.spec.whatwg.org/multipage/webappapis.html#handler-onabort
  "onabort",
  ...Array.from(
    $("#ix-event-handlers > tbody > tr > th:first-child > code"),
    (element) => $(element).text(),
  ),
].toSorted();

await fs.writeFile(
  new URL(`../index.json`, import.meta.url),
  JSON.stringify(names, undefined, 2) + "\n",
);

await fs.writeFile(
  new URL(`../index.d.ts`, import.meta.url),
  outdent`
    type HtmlEventAttributes =
    ${names.map((name) => `  | "${name}"`).join("\n")};

    /**
    List of HTML event handler attributes.

    @example
    \`\`\`
    import htmlEventAttributes from "@prettier/html-event-attributes";

    console.log(htmlEventAttributes);
    //=> ['onabort', 'onafterprint', 'onauxclick', …]
    \`\`\`
    */
    declare const htmlEventAttributes: readonly HtmlEventAttributes[];

    export default htmlEventAttributes;\n
	`,
);
