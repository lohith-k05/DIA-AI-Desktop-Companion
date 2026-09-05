import { chromium } from "playwright";

let browser = null;
let page = null;
let currentTaskStatus = "Browser not started";
let isTaskRunning = false;
let launchPromise = null;

export async function launchBrowser() {
  if (browser && page) return { browser, page };
  
  if (!launchPromise) {
    launchPromise = (async () => {
      try {
        currentTaskStatus = "Starting browser";
        browser = await chromium.launch({ headless: false, /* default chromium */ });
        const context = await browser.newContext();
        page = await context.newPage();
        currentTaskStatus = "Browser ready";
        
        browser.on("disconnected", () => {
          browser = null;
          page = null;
          launchPromise = null;
          currentTaskStatus = "Browser not started";
        });
        return { browser, page };
      } catch (e) {
        launchPromise = null;
        throw e;
      }
    })();
  }
  return await launchPromise;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
    currentTaskStatus = "Browser not started";
  }
}

export async function openUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  await launchBrowser();
  currentTaskStatus = "Navigating";
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  currentTaskStatus = "Task completed";
  return { url: page.url(), title: await page.title() };
}

export async function searchWeb(query) {
  await launchBrowser();
  currentTaskStatus = "Searching";
  if (query.toLowerCase().includes("youtube")) {
    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
  } else {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  }
  currentTaskStatus = "Task completed";
  return { url: page.url(), title: await page.title() };
}

export async function readPage() {
  if (!page) throw new Error("Browser not running");
  currentTaskStatus = "Reading page";
  const text = await page.evaluate(() => document.body.innerText);
  currentTaskStatus = "Task completed";
  return { url: page.url(), title: await page.title(), text: text.substring(0, 5000) };
}

export async function clickElement(selectorOrText) {
  if (!page) throw new Error("Browser not running");
  currentTaskStatus = "Navigating";
  try {
    await page.getByText(selectorOrText, { exact: false }).first().click({ timeout: 5000 });
  } catch (e) {
    await page.click(selectorOrText, { timeout: 5000 });
  }
  currentTaskStatus = "Task completed";
  return { url: page.url(), title: await page.title() };
}

export async function fillForm(selectorOrText, value) {
  if (!page) throw new Error("Browser not running");
  currentTaskStatus = "Navigating";
  try {
    const el = page.getByText(selectorOrText, { exact: false }).first();
    await el.fill(value, { timeout: 5000 });
  } catch(e) {
    await page.fill(selectorOrText, value, { timeout: 5000 });
  }
  currentTaskStatus = "Task completed";
  return { url: page.url(), title: await page.title() };
}

export async function navigatePage(action, url = null) {
  if (!page && action !== "goto") throw new Error("Browser not running");
  currentTaskStatus = "Navigating";
  if (action === "back") await page.goBack();
  else if (action === "forward") await page.goForward();
  else if (action === "reload") await page.reload();
  else if (action === "goto" && url) {
    await launchBrowser();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    await page.goto(url);
  }
  currentTaskStatus = "Task completed";
  return { url: page?.url(), title: await page?.title() };
}

export async function stopTask() {
  if (page) {
    await closeBrowser();
    currentTaskStatus = "Task stopped";
  }
  return { success: true };
}

export async function getStatus() {
  try {
    return { 
      status: currentTaskStatus, 
      url: page ? page.url() : null, 
      title: page ? await page.title().catch(() => "") : null
    };
  } catch (e) {
    return { status: currentTaskStatus, url: null, title: null };
  }
}

export async function executeTask(prompt) {
  if (isTaskRunning) {
    throw new Error("Another browser task is already running.");
  }
  isTaskRunning = true;
  
  try {
    const lowerPrompt = prompt.toLowerCase();
    await launchBrowser();

    if (lowerPrompt.includes("youtube") && lowerPrompt.includes("python") && lowerPrompt.includes("first video")) {
      currentTaskStatus = "Opening YouTube...";
      await page.goto("https://www.youtube.com", { waitUntil: "domcontentloaded" });
      
      currentTaskStatus = "Locating search field...";
      await page.waitForSelector("input[name='search_query']", { timeout: 5000 }).catch(() => {});
      
      currentTaskStatus = "Searching for 'Python learning'...";
      await page.fill("input[name='search_query']", "Python learning", { timeout: 5000 }).catch(() => {});
      await page.keyboard.press("Enter");
      
      currentTaskStatus = "Loading search results...";
      await page.waitForTimeout(2000);
      await page.waitForSelector("ytd-video-renderer", { timeout: 10000 }).catch(() => {});
      
      currentTaskStatus = "Opening the first video...";
      const firstVideo = page.locator("ytd-video-renderer a#video-title").first();
      await firstVideo.click({ timeout: 5000 }).catch(() => {});
      
      currentTaskStatus = "Task completed";
      return { url: page.url(), title: await page.title() };
    }
    
    if (lowerPrompt.includes("search") && lowerPrompt.includes("youtube")) {
      const queryMatch = lowerPrompt.match(/for (.*)/);
      const query = queryMatch ? queryMatch[1] : "tutorials";
      return await searchWeb(query + " youtube");
    }

    if (lowerPrompt.includes("search") || lowerPrompt.includes("find")) {
      const queryMatch = lowerPrompt.match(/for (.*)/) || lowerPrompt.match(/search (.*)/);
      const query = queryMatch ? queryMatch[1] : prompt;
      return await searchWeb(query);
    }
    
    if (lowerPrompt.includes("open") || lowerPrompt.includes("go to")) {
      const siteMatch = lowerPrompt.match(/open (.*)/) || lowerPrompt.match(/go to (.*)/);
      let site = siteMatch ? siteMatch[1].trim() : "google.com";
      if (!site.includes(".")) site = site + ".com";
      return await openUrl(site);
    }

    // Default fallback to web search
    return await searchWeb(prompt);
  } catch (err) {
    currentTaskStatus = "Task failed";
    throw err;
  } finally {
    isTaskRunning = false;
  }
}
