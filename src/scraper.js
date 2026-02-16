import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Add stealth plugin
puppeteer.use(StealthPlugin());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class InstagramScraper {
  constructor(options = {}) {
    this.username = options.username || process.env.INSTAGRAM_USERNAME;
    this.password = options.password || process.env.INSTAGRAM_PASSWORD;
    this.targetAccount = options.targetAccount || process.env.TARGET_ACCOUNT || 'pepsi.korea';
    this.maxPosts = options.maxPosts || parseInt(process.env.MAX_POSTS) || 50;
    this.headless = options.headless !== undefined ? options.headless : process.env.HEADLESS !== 'false';
    this.screenshot = options.screenshot || process.env.SCREENSHOT === 'true';
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🚀 Initializing browser...');

    this.browser = await puppeteer.launch({
      headless: this.headless ? 'new' : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
      ],
      executablePath: process.env.CHROME_PATH || undefined,
    });

    this.page = await this.browser.newPage();

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set language
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
    });

    console.log('✅ Browser initialized');
  }

  async login() {
    if (!this.username || !this.password) {
      console.log('⚠️  No credentials provided, skipping login (limited access)');
      return false;
    }

    try {
      console.log('🔐 Logging in to Instagram...');
      await this.page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      // Accept cookies if present
      try {
        await this.page.waitForSelector('button:has-text("Allow all cookies")', { timeout: 3000 });
        await this.page.click('button:has-text("Allow all cookies")');
      } catch (e) {
        // Cookie banner might not appear
      }

      await this.page.waitForSelector('input[name="username"]');
      await this.page.type('input[name="username"]', this.username, { delay: 100 });
      await this.page.type('input[name="password"]', this.password, { delay: 100 });
      await this.page.click('button[type="submit"]');

      await this.page.waitForTimeout(5000);

      // Handle "Save Your Login Info" prompt
      try {
        const notNowButton = await this.page.waitForSelector('button:has-text("Not now")', { timeout: 3000 });
        await notNowButton.click();
      } catch (e) {
        // Prompt might not appear
      }

      // Handle "Turn on Notifications" prompt
      try {
        const notNowButton = await this.page.waitForSelector('button:has-text("Not Now")', { timeout: 3000 });
        await notNowButton.click();
      } catch (e) {
        // Prompt might not appear
      }

      console.log('✅ Logged in successfully');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return false;
    }
  }

  async navigateToProfile() {
    console.log(`📍 Navigating to @${this.targetAccount}...`);
    const profileUrl = `https://www.instagram.com/${this.targetAccount}/`;
    await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
    await this.page.waitForTimeout(3000);

    if (this.screenshot) {
      await this.page.screenshot({
        path: path.join(__dirname, '../screenshots', 'profile.png'),
        fullPage: true
      });
    }

    console.log('✅ Profile loaded');
  }

  async scrapePostUrls() {
    console.log('🔍 Collecting post URLs...');
    const postUrls = [];
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 20;

    while (postUrls.length < this.maxPosts && scrollAttempts < maxScrollAttempts) {
      // Get all post links
      const links = await this.page.$$eval('article a[href*="/p/"]', elements =>
        elements.map(el => el.href)
      );

      // Add unique URLs
      links.forEach(url => {
        if (!postUrls.includes(url) && postUrls.length < this.maxPosts) {
          postUrls.push(url);
        }
      });

      console.log(`   Found ${postUrls.length} posts so far...`);

      if (postUrls.length >= this.maxPosts) {
        break;
      }

      // Scroll down
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.page.waitForTimeout(2000);

      const currentHeight = await this.page.evaluate(() => document.body.scrollHeight);

      if (currentHeight === previousHeight) {
        scrollAttempts++;
      } else {
        scrollAttempts = 0;
        previousHeight = currentHeight;
      }
    }

    console.log(`✅ Collected ${postUrls.length} post URLs`);
    return postUrls.slice(0, this.maxPosts);
  }

  async scrapePost(url) {
    try {
      await this.page.goto(url, { waitUntil: 'networkidle2' });
      await this.page.waitForTimeout(2000);

      const postData = await this.page.evaluate(() => {
        const data = {};

        // Get images/videos
        const mediaElements = document.querySelectorAll('article img[srcset], article video[src]');
        data.media = Array.from(mediaElements).map(el => {
          if (el.tagName === 'IMG') {
            const srcset = el.getAttribute('srcset');
            if (srcset) {
              const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
              return { type: 'image', url: urls[urls.length - 1] || el.src };
            }
            return { type: 'image', url: el.src };
          } else {
            return { type: 'video', url: el.src };
          }
        });

        // Get caption/description
        const captionElement = document.querySelector('h1');
        data.caption = captionElement ? captionElement.textContent.trim() : '';

        // Alternative caption location
        if (!data.caption) {
          const altCaption = document.querySelector('article span[dir="auto"]');
          data.caption = altCaption ? altCaption.textContent.trim() : '';
        }

        // Extract hashtags from caption
        data.hashtags = [];
        if (data.caption) {
          const hashtagMatches = data.caption.match(/#[\w가-힣]+/g);
          if (hashtagMatches) {
            data.hashtags = hashtagMatches;
          }
        }

        // Get likes count
        const likesElement = document.querySelector('section span[class*="x193iq5w"]');
        data.likes = likesElement ? likesElement.textContent.trim() : '0';

        // Alternative likes selector
        if (data.likes === '0') {
          const altLikes = document.querySelector('section a[href*="/liked_by/"] span');
          data.likes = altLikes ? altLikes.textContent.trim() : '0';
        }

        // Get post date
        const timeElement = document.querySelector('time');
        data.timestamp = timeElement ? timeElement.getAttribute('datetime') : null;
        data.date = timeElement ? timeElement.getAttribute('title') || timeElement.textContent : null;

        // Get location
        const locationElement = document.querySelector('a[href*="/explore/locations/"]');
        data.location = locationElement ? locationElement.textContent.trim() : null;

        // Try to get comments count
        data.commentsCount = '0';

        return data;
      });

      // Try to get more accurate comments count
      try {
        const commentsSection = await this.page.$('section');
        if (commentsSection) {
          const commentsText = await this.page.evaluate(el => el.textContent, commentsSection);
          const match = commentsText.match(/(\d+)\s*(comments|댓글)/i);
          if (match) {
            postData.commentsCount = match[1];
          }
        }
      } catch (e) {
        // Comments count not found
      }

      postData.url = url;
      postData.postId = url.match(/\/p\/([^\/]+)/)?.[1] || null;

      return postData;
    } catch (error) {
      console.error(`❌ Error scraping post ${url}:`, error.message);
      return null;
    }
  }

  async scrapePosts() {
    console.log('\n📊 Starting to scrape posts...\n');
    const postUrls = await this.scrapePostUrls();
    const posts = [];

    for (let i = 0; i < postUrls.length; i++) {
      console.log(`\n[${i + 1}/${postUrls.length}] Scraping post...`);
      const postData = await this.scrapePost(postUrls[i]);

      if (postData) {
        posts.push(postData);
        console.log(`✅ Caption: ${postData.caption.substring(0, 50)}...`);
        console.log(`   Likes: ${postData.likes}, Comments: ${postData.commentsCount}`);
        console.log(`   Hashtags: ${postData.hashtags.join(', ')}`);
      }

      // Random delay to avoid detection
      await this.page.waitForTimeout(1000 + Math.random() * 2000);
    }

    return posts;
  }

  async saveData(posts) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `instagram_${this.targetAccount}_${timestamp}.json`;
    const filepath = path.join(__dirname, '../data', filename);

    const data = {
      account: this.targetAccount,
      scrapedAt: new Date().toISOString(),
      totalPosts: posts.length,
      posts: posts
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`\n💾 Data saved to: ${filepath}`);

    // Also save as latest.json for easy access
    const latestPath = path.join(__dirname, '../data', 'latest.json');
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Data also saved to: ${latestPath}`);

    return filepath;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('\n👋 Browser closed');
    }
  }

  async run() {
    try {
      await this.initialize();

      const loggedIn = await this.login();
      if (!loggedIn) {
        console.log('⚠️  Continuing without login...');
      }

      await this.navigateToProfile();
      const posts = await this.scrapePosts();

      if (posts.length > 0) {
        await this.saveData(posts);
        console.log(`\n✨ Successfully scraped ${posts.length} posts from @${this.targetAccount}`);
      } else {
        console.log('\n⚠️  No posts were scraped');
      }

      return posts;
    } catch (error) {
      console.error('\n❌ Scraping failed:', error);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new InstagramScraper();
  scraper.run().catch(console.error);
}

export default InstagramScraper;
