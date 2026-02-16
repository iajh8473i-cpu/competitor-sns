#!/usr/bin/env node

import InstagramScraper from './scraper.js';
import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Instagram Scraper for Competitor Analysis

Usage:
  npm start [options]

Options:
  --account <username>    Instagram account to scrape (default: pepsi.korea)
  --max <number>          Maximum number of posts to scrape (default: 50)
  --username <username>   Instagram login username (optional)
  --password <password>   Instagram login password (optional)
  --headless <true|false> Run in headless mode (default: true)
  --screenshot            Take screenshots during scraping
  --help                  Show this help message

Examples:
  npm start
  npm start -- --account pepsi.korea --max 30
  npm start -- --account cocacola --max 100 --headless false

Environment Variables (.env):
  INSTAGRAM_USERNAME      Your Instagram username
  INSTAGRAM_PASSWORD      Your Instagram password
  TARGET_ACCOUNT          Target account to scrape
  MAX_POSTS              Maximum posts to scrape
  HEADLESS               Run in headless mode (true/false)
  SCREENSHOT             Take screenshots (true/false)
  `);
}

function parseArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      case '--account':
        options.targetAccount = args[++i];
        break;
      case '--max':
        options.maxPosts = parseInt(args[++i]);
        break;
      case '--username':
        options.username = args[++i];
        break;
      case '--password':
        options.password = args[++i];
        break;
      case '--headless':
        options.headless = args[++i] === 'true';
        break;
      case '--screenshot':
        options.screenshot = true;
        break;
    }
  }

  return options;
}

async function main() {
  console.log(`
╔═══════════════════════════════════════╗
║   Instagram Scraper - Pepsi Korea     ║
║   Competitor SNS Analysis Tool        ║
╚═══════════════════════════════════════╝
  `);

  const options = parseArgs(args);
  const scraper = new InstagramScraper(options);

  try {
    await scraper.run();
    console.log('\n✨ Scraping completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
