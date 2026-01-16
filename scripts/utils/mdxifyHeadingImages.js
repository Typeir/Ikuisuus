const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT_DIR = path.resolve(process.cwd(), 'src', 'content'); // Adjust as needed

// Regex to match markdown image in first 10 lines: ![AltText](ImagePath)
const IMAGE_MARKDOWN_REGEX = /^!\[(.*?)\]\((.*?)\)$/;

/**
 * Replace the first markdown image in the first 10 lines of a `.sheet.mdx` file
 * with a JSX <BlendedImage> component.
 *
 * @param {string} filePath - Absolute path to the `.sheet.mdx` file.
 * @returns {void}
 */
function replaceHeadingImage(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(IMAGE_MARKDOWN_REGEX);
    if (match) {
      const alt = match[1];
      const src = match[2];
      // Replace markdown image syntax with React component usage
      lines[i] = `<BlendedImage src="${src}" alt="${alt}" />`;
      console.log(`Replaced image in ${filePath} line ${i + 1}`);
      break; // Only replace the first matched image
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

/**
 * Main entry point: finds all `.sheet.mdx` files in the content directory
 * and replaces their heading markdown images.
 *
 * @returns {void}
 */
function main() {
  const pattern = path.join(ROOT_DIR, '**/*.sheet.mdx');
  glob(pattern, (err, files) => {
    if (err) {
      console.error('Error finding .sheet.mdx files:', err);
      return;
    }
    files.forEach(replaceHeadingImage);
  });
}

main();
