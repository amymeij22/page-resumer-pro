/**
 * Content script for Page Resumer extension
 * Extracts and processes content from the current webpage
 */

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractContent') {
    try {
      // Extract the page content
      const content = extractPageContent();
      const pageTitle = document.title;
      const pageUrl = window.location.href;
      
      // Send back the extracted content
      sendResponse({
        success: true,
        content,
        pageInfo: {
          title: pageTitle,
          url: pageUrl
        }
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  return true; // Keep the messaging channel open for async response
});

/**
 * Extracts meaningful content from the current page
 * Prioritizes article content and main text
 * @returns {string} The extracted text content
 */
function extractPageContent() {
  let content = '';
  
  // Try to find the main content using common selectors for articles and main content
  const possibleContentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    // Add more specific selectors for different types of websites
    '[itemprop="articleBody"]',
    '.story-body',
    '.story-content',
    '.news-article',
    '.page-content',
    '.post-body',
    '.blog-post',
    '.article-body',
    '.markdown-body', // GitHub style content
    '.post',
    '.single-post',
    '#content',
    '.text-content'
  ];
  
  // Try each selector until we find content
  for (const selector of possibleContentSelectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      for (const element of elements) {
        content += element.innerText + '\n\n';
      }
      // If we found substantial content, return it
      if (content.length > 300) {
        console.log(`Content found using selector: ${selector}`);
        return cleanup(content);
      }
    }
  }
  
  console.log('No content found using standard selectors, trying alternative methods');
  
  // If no specific content area found, get all paragraph text
  const paragraphs = document.querySelectorAll('p');
  if (paragraphs.length > 0) {
    console.log(`Found ${paragraphs.length} paragraphs`);
    
    // Sort paragraphs by length to prioritize content paragraphs
    const sortedParagraphs = Array.from(paragraphs)
      .filter(p => isLikelyContentParagraph(p))
      .sort((a, b) => b.innerText.length - a.innerText.length);
    
    console.log(`Filtered to ${sortedParagraphs.length} likely content paragraphs`);
    
    // Take top 75% of paragraphs by length or at least 5 paragraphs if available
    const minParagraphs = Math.min(5, sortedParagraphs.length);
    const contentParagraphs = sortedParagraphs.slice(
      0, Math.max(minParagraphs, Math.ceil(sortedParagraphs.length * 0.75))
    );
    
    for (const p of contentParagraphs) {
      content += p.innerText + '\n\n';
    }
    
    if (content.length > 200) {
      console.log(`Extracted ${content.length} characters from paragraphs`);
      return cleanup(content);
    }
  }
  
  // Try direct element selection for specific sites with unique structures
  console.log('Trying direct element selection');
  
  // If still no content, get headings and list items
  if (content.length < 200) {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const heading of headings) {
      if (heading.innerText.length > 5 && isVisible(heading)) {
        content += heading.innerText + '\n\n';
      }
    }
    
    const listItems = document.querySelectorAll('li');
    for (const item of listItems) {
      if (item.innerText.length > 20 && isVisible(item)) {
        content += '• ' + item.innerText + '\n';
      }
    }
    
    console.log(`Extracted ${content.length} characters from headings and lists`);
  }
  
  // Absolute last resort: get all visible text
  if (content.length < 200) {
    console.log('Using last resort method: all visible text');
    content = getAllVisibleText();
  }
  
  return cleanup(content);
}

/**
 * Gets all visible text from the page by recursively traversing DOM
 * @returns {string} All visible text from the page
 */
function getAllVisibleText() {
  let text = '';
  const nodesToProcess = [document.body];
  
  const nonContentTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'VIDEO', 'AUDIO', 'SVG', 'CANVAS', 'META'];
  
  while (nodesToProcess.length > 0) {
    const node = nodesToProcess.shift();
    
    if (!node) continue;
    
    // Skip non-content elements
    if (nonContentTags.includes(node.nodeName)) continue;
    
    // Skip hidden elements
    if (!isVisible(node)) continue;
    
    // Skip elements with CSS classes/IDs suggesting they're not main content
    if (isNavigationOrFooter(node)) continue;
    
    // Process text nodes
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
      text += node.textContent.trim() + '\n';
    }
    
    // Add children to processing queue
    for (const child of node.childNodes) {
      nodesToProcess.push(child);
    }
  }
  
  console.log(`Extracted ${text.length} characters from full page`);
  return text;
}

/**
 * Determines if an element is visible
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element is visible
 */
function isVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return style.display !== 'none' && 
         style.visibility !== 'hidden' && 
         style.opacity !== '0' &&
         rect.width > 0 && rect.height > 0;
}

/**
 * Determines if an element is likely navigation or footer
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element appears to be navigation/footer
 */
function isNavigationOrFooter(element) {
  if (!element || !element.className || typeof element.className !== 'string') return false;
  
  const nonContentIdentifiers = [
    'nav', 'navigation', 'menu', 'sidebar', 'footer', 'header', 'banner',
    'widget', 'cookie', 'popup', 'modal', 'ad', 'ads', 'promo',
    'comment', 'social', 'related', 'share', 'search'
  ];
  
  const className = element.className.toLowerCase();
  const id = element.id?.toLowerCase() || '';
  const tagName = element.tagName.toLowerCase();
  
  // Check if the element is tagged as navigation or header/footer
  if (tagName === 'nav' || tagName === 'header' || tagName === 'footer') {
    return true;
  }
  
  // Check if element has role="navigation"
  if (element.getAttribute('role') === 'navigation') {
    return true;
  }
  
  // Check for common non-content identifiers
  for (const term of nonContentIdentifiers) {
    if (className.includes(term) || id.includes(term)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determines if a paragraph is likely to be main content vs navigation/footer/etc
 * @param {Element} paragraph - The paragraph DOM element to check
 * @returns {boolean} True if it appears to be content
 */
function isLikelyContentParagraph(paragraph) {
  // Check if the paragraph has meaningful length
  if (paragraph.innerText.length < 20) return false;
  
  // Check if the paragraph is visible
  if (!isVisible(paragraph)) return false;
  
  // Check if it's in a likely non-content area
  if (isNavigationOrFooter(paragraph)) return false;
  
  // Check if parent is a non-content area
  const parent = paragraph.parentElement;
  if (parent && isNavigationOrFooter(parent)) return false;
  
  return true;
}

/**
 * Cleans up extracted content to improve quality
 * @param {string} text - The raw extracted text
 * @returns {string} Cleaned text
 */
function cleanup(text) {
  return text
    // Remove excess whitespace
    .replace(/\s+/g, ' ')
    // Remove duplicate line breaks
    .replace(/\n\s*\n+/g, '\n\n')
    // Trim whitespace
    .trim();
}