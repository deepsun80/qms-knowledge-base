import axios from 'axios';
import * as cheerio from 'cheerio';

const CFR_820_URL =
  'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820';

interface RegulatorySection {
  standard: string;
  section_number: string;
  title: string;
  content: string;
  subpart?: string;
}

async function scrapeCFR820() {
  console.log('🔍 Fetching 21 CFR 820 from eCFR...');

  try {
    const response = await axios.get(CFR_820_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = response.data;
    const $ = cheerio.load(html);

    console.log('✅ Page fetched successfully!\n');
    console.log('📦 Extracting sections...\n');

    const sections: RegulatorySection[] = [];

    // Extract all div elements with IDs starting with "820"
    $('div[id^="820"]').each((i, elem) => {
      const $elem = $(elem);
      const id = $elem.attr('id') || '';
      const fullText = $elem.text().trim();

      // Extract section number and title from the first line
      // Pattern: "§ 820.1 Scope."
      const firstLine = fullText.split('\n')[0];
      const match = firstLine.match(/§\s*(\d+\.\d+)\s+(.+?)\.?$/);

      if (match) {
        const sectionNumber = match[1]; // "820.1"
        const title = match[2].trim(); // "Scope"

        // Get content (everything after the first line)
        const content = fullText.substring(firstLine.length).trim();

        const section: RegulatorySection = {
          standard: '21 CFR 820',
          section_number: sectionNumber,
          title: title,
          content: content,
        };

        sections.push(section);

        // Log first 3 for verification
        if (i < 3) {
          console.log(`━━━ Section ${i + 1} ━━━`);
          console.log('🔢 Section:', sectionNumber);
          console.log('📝 Title:', title);
          console.log('📄 Content length:', content.length, 'characters');
          console.log('📄 Content preview:', content.substring(0, 150) + '...');
          console.log('');
        }
      }
    });

    console.log(`✅ Extracted ${sections.length} sections total!\n`);

    // Show summary
    console.log('📊 Summary:');
    sections.slice(0, 5).forEach((s) => {
      console.log(`   • §${s.section_number} - ${s.title}`);
    });
    console.log(`   ... and ${sections.length - 5} more\n`);

    // Save to JSON file for inspection
    const fs = require('fs');
    fs.writeFileSync('cfr820-sections.json', JSON.stringify(sections, null, 2));
    console.log('💾 Saved to cfr820-sections.json');
  } catch (error) {
    console.error('❌ Error scraping:', error);
  }
}

scrapeCFR820();
