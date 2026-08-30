import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import AdmZip from 'adm-zip';

// DOCX is a zip of XML; mammoth already knows how to walk it and give back
// plain text, so there's no need to touch the zip ourselves here (unlike
// PPTX below, which has no equivalent well-maintained pure-JS reader).
export async function extractTextFromDocx(absolutePath) {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value.trim();
}

export async function extractTextFromPdf(absolutePath) {
    const buffer = fs.readFileSync(absolutePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
}

// PPTX has no equivalent of mammoth in the pure-JS ecosystem, so this reads
// the zip directly: each slide is ppt/slides/slideN.xml, and every run of
// text sits inside an <a:t> tag. Pulling just those tags (rather than a
// full XML parse) is enough for extracted/searchable text — layout,
// formatting, and speaker notes are out of scope for search.
export async function extractTextFromPptx(absolutePath) {
    const zip = new AdmZip(absolutePath);
    const slideEntries = zip
        .getEntries()
        .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
        .sort((a, b) => {
            const numberOf = (name) => Number(name.match(/slide(\d+)\.xml$/)[1]);
            return numberOf(a.entryName) - numberOf(b.entryName);
        });

    const slideTexts = slideEntries.map((entry) => {
        const xml = entry.getData().toString('utf8');
        const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)];
        return matches
            .map((match) => decodeXmlEntities(match[1]))
            .join(' ');
    });

    return slideTexts.join('\n\n').trim();
}

function decodeXmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
