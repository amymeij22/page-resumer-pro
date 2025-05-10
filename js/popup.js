/**
 * Popup script for Page Resumer extension
 * Handles UI interactions in the extension popup
 */

// DOM elements
const elementsById = {
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  generateResumeBtn: document.getElementById('generate-resume'),
  summaryResult: document.getElementById('summary-result'),
  questionInput: document.getElementById('question-input'),
  askAiBtn: document.getElementById('ask-ai'),
  answerResult: document.getElementById('answer-result'),
  copySummaryBtn: document.getElementById('copy-summary'),
  copyAnswerBtn: document.getElementById('copy-answer'),
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history'),
  exportSummaryPdfBtn: document.getElementById('export-summary-pdf'),
  exportHistoryPdfBtn: document.getElementById('export-history-pdf'),
  apiKeyInput: document.getElementById('api-key-input'),
  saveApiKeyBtn: document.getElementById('save-api-key'),
  languageRadios: document.getElementsByName('language'),
  loadingOverlay: document.getElementById('loading'),
  setupOverlay: document.getElementById('setup-overlay'),
  setupApiKey: document.getElementById('setup-api-key'),
  completeSetupBtn: document.getElementById('complete-setup'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  answerStyle: document.getElementById('answer-style'),
  contextIndicator: document.getElementById('context-indicator'),
  sourceSelector: document.getElementById('source-selector'),
  conversationHistory: document.getElementById('conversation-history'),
  questionCount: document.getElementById('question-count'),
  clearContextBtn: document.getElementById('clear-context'),
  sourceRadios: document.getElementsByName('source')
};

// State management
let state = {
  currentContent: '',
  currentPageInfo: null,
  currentSummary: '',
  currentAnswer: '',
  apiKey: '',
  language: 'en',
  theme: 'light',
  history: [],
  historyFilters: {
    search: '',
    website: 'all',
    tag: 'all',
    type: 'all'
  },
  selectedHistoryItems: [],
  selectionMode: false,
  availableTags: [],
  answerStyle: 'standard',
  conversationContext: {
    hasContext: false,
    questionCount: 0,
    previousQA: []
  },
  useStoredContext: false,
  sourceType: 'page',
  currentTabId: null
};

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Force check for API key before anything else is initialized
  const apiKeyCheck = await chrome.storage.local.get(['apiKey', 'firstInstall']);
  console.log('API Key check:', apiKeyCheck); // Debug log
  
  // Clear any previous active class on the overlay (in case it's persisting from a previous session)
  document.getElementById('setup-overlay').classList.remove('active');
  
  const isFirstInstall = apiKeyCheck.firstInstall !== false; // If undefined or true, treat as first install
  state.apiKey = apiKeyCheck.apiKey || '';
  
  console.log('First install?', isFirstInstall); // Debug log
  console.log('API key exists?', !!state.apiKey); // Debug log

  // Show setup overlay IMMEDIATELY if no API key is stored or if it's the first installation
  if (!state.apiKey || isFirstInstall) {
    console.log('Should show setup overlay'); // Debug log
    const setupOverlay = document.getElementById('setup-overlay');
    setupOverlay.classList.add('active');
    setupOverlay.style.display = 'flex'; // Ensure display property is set
    setupOverlay.style.opacity = '1';    // Force opacity
    
    // Focus on the API key input after a short delay
    setTimeout(() => {
      const setupApiKey = document.getElementById('setup-api-key');
      if (setupApiKey) setupApiKey.focus();
    }, 300);
  }

  // Mark as not a first install for future checks
  if (isFirstInstall) {
    await chrome.storage.local.set({ firstInstall: false });
  }
  
  // Continue with the rest of the initialization
  await loadSettings();
  await loadHistory();
  initializeUi();
  initHistoryFilters();
  
  // Get current tab ID for conversation context
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    state.currentTabId = tabs[0].id;
    await checkConversationContext();
  }
});

/**
 * Loads saved settings from Chrome storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['apiKey', 'language', 'theme', 'answerStyle']);
    state.apiKey = result.apiKey || '';
    state.language = result.language || 'en';
    state.theme = result.theme || 'light';
    state.answerStyle = result.answerStyle || 'standard';
    
    // Update UI based on loaded settings
    elementsById.apiKeyInput.value = state.apiKey;
    document.querySelector(`input[name="language"][value="${state.language}"]`).checked = true;
    
    // Update answer style selector
    if (elementsById.answerStyle) {
      elementsById.answerStyle.value = state.answerStyle;
    }
    
    // Apply theme
    applyTheme(state.theme);
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Loads summary/answer history from Chrome storage
 */
async function loadHistory() {
  try {
    const result = await chrome.storage.local.get(['history', 'availableTags']);
    state.history = result.history || [];
    state.availableTags = result.availableTags || [];
    renderHistory();
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

/**
 * Sets up event listeners and initializes UI
 */
function initializeUi() {
  // Tab navigation
  elementsById.tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  
  // Generate summary
  elementsById.generateResumeBtn.addEventListener('click', generateSummary);
  
  // Ask question
  elementsById.askAiBtn.addEventListener('click', askQuestion);
  elementsById.questionInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  });
  
  // Copy functionality
  elementsById.copySummaryBtn.addEventListener('click', () => copyText(state.currentSummary));
  elementsById.copyAnswerBtn.addEventListener('click', () => copyText(state.currentAnswer));
  
  // History management
  elementsById.clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Export to PDF
  elementsById.exportSummaryPdfBtn.addEventListener('click', exportSummaryToPdf);
  elementsById.exportHistoryPdfBtn.addEventListener('click', exportHistoryToPdf);
  
  // API Key
  elementsById.saveApiKeyBtn.addEventListener('click', saveApiKey);
  
  // Language selection
  elementsById.languageRadios.forEach(radio => {
    radio.addEventListener('change', changeLanguage);
  });
  
  // Theme toggle
  elementsById.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Setup
  elementsById.completeSetupBtn.addEventListener('click', completeSetup);
  
  // Answer style
  if (elementsById.answerStyle) {
    elementsById.answerStyle.addEventListener('change', () => {
      state.answerStyle = elementsById.answerStyle.value;
      chrome.storage.local.set({ answerStyle: state.answerStyle });
    });
  }
  
  // Conversation context
  if (elementsById.clearContextBtn) {
    elementsById.clearContextBtn.addEventListener('click', clearConversationContext);
  }
  
  // Source selection
  if (elementsById.sourceRadios) {
    Array.from(elementsById.sourceRadios).forEach(radio => {
      radio.addEventListener('change', () => {
        state.sourceType = radio.value;
        state.useStoredContext = (radio.value === 'summary');
      });
    });
  }
}

/**
 * Checks if there is a conversation context for the current tab
 */
async function checkConversationContext() {
  if (!state.currentTabId) return;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'getConversationContext',
      tabId: state.currentTabId
    });
    
    if (response.success) {
      // We have context for this tab
      updateConversationIndicator(response.context);
    }
  } catch (error) {
    console.error('Error checking conversation context:', error);
  }
}

/**
 * Updates the conversation context indicator
 */
function updateConversationIndicator(context) {
  if (!context) return;
  
  state.conversationContext = {
    hasContext: true,
    questionCount: context.previousQA?.length || 0,
    previousQA: context.previousQA || []
  };
  
  // Update UI to show context - only show Clear Context button without the question count
  if (elementsById.contextIndicator) {
    elementsById.contextIndicator.classList.remove('hidden');
    
    // Hide the text part and only show the Clear button
    const textElement = elementsById.contextIndicator.querySelector('span');
    if (textElement) {
      textElement.style.display = 'none';
    }
  }
  
  // Enable source selector if we have a summary
  if (state.currentSummary && elementsById.sourceSelector) {
    elementsById.sourceSelector.classList.remove('hidden');
  }
  
  // Display conversation history if available
  if (state.conversationContext.previousQA && state.conversationContext.previousQA.length > 0) {
    displayConversationHistory();
  }
}

/**
 * Displays the conversation history in the UI
 */
function displayConversationHistory() {
  if (!elementsById.conversationHistory || !state.conversationContext.previousQA) return;
  
  const historyContent = state.conversationContext.previousQA.map((qa, index) => `
    <div class="conversation-entry">
      <div class="conversation-question">Q: ${qa.question}</div>
      <div class="conversation-answer">${qa.answer}</div>
    </div>
  `).join('');
  
  elementsById.conversationHistory.innerHTML = historyContent;
  elementsById.conversationHistory.classList.remove('hidden');
}

/**
 * Clears the conversation context for the current tab
 */
async function clearConversationContext() {
  if (!state.currentTabId) return;
  
  try {
    await chrome.runtime.sendMessage({
      action: 'clearConversationContext',
      tabId: state.currentTabId
    });
    
    // Reset local state
    state.conversationContext = {
      hasContext: false,
      questionCount: 0,
      previousQA: []
    };
    
    // Update UI
    if (elementsById.contextIndicator) {
      elementsById.contextIndicator.classList.add('hidden');
    }
    
    if (elementsById.conversationHistory) {
      elementsById.conversationHistory.classList.add('hidden');
      elementsById.conversationHistory.innerHTML = '';
    }
    
    showToast('Conversation context cleared');
  } catch (error) {
    console.error('Error clearing conversation context:', error);
    showToast('Error clearing context', 'error');
  }
}

/**
 * Switches between tabs in the UI
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchTab(tabId) {
  // Update active tab button
  elementsById.tabButtons.forEach(button => {
    if (button.dataset.tab === tabId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
  
  // Update active tab pane
  elementsById.tabPanes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

/**
 * Generates a summary of the current page content
 */
async function generateSummary() {
  try {
    showLoading();
    
    // Extract content if not already done
    if (!state.currentContent) {
      await extractContent();
    }
    
    if (!state.currentContent) {
      hideLoading();
      showError(elementsById.summaryResult, 'No content could be extracted from this page.');
      return;
    }
    
    // Request summary from background script
    const response = await chrome.runtime.sendMessage({
      action: 'requestSummary',
      content: state.currentContent,
      apiKey: state.apiKey,
      language: state.language
    });
    
    hideLoading();
    
    if (!response.success) {
      showError(elementsById.summaryResult, `Error: ${response.error}`);
      return;
    }
    
    // Update state and UI
    state.currentSummary = response.summary;
    elementsById.summaryResult.innerHTML = `<div class="summary-text">${formatTextWithLineBreaks(response.summary)}</div>`;
    
    // Add to history
    addToHistory({
      type: 'summary',
      pageInfo: state.currentPageInfo,
      content: response.summary,
      timestamp: new Date().toISOString()
    });
    
    // Show source selector in Ask AI tab if we have a summary
    if (elementsById.sourceSelector) {
      elementsById.sourceSelector.classList.remove('hidden');
    }
    
  } catch (error) {
    hideLoading();
    showError(elementsById.summaryResult, `Error: ${error.message}`);
  }
}

/**
 * Asks a question about the current page content
 */
async function askQuestion() {
  const question = elementsById.questionInput.value.trim();
  
  if (!question) {
    showError(elementsById.answerResult, 'Please enter a question.');
    return;
  }
  
  try {
    showLoading();
    
    // Extract content if not already done
    if (!state.currentContent) {
      await extractContent();
    }
    
    if (!state.currentContent) {
      hideLoading();
      showError(elementsById.answerResult, 'No content could be extracted from this page.');
      return;
    }
    
    // Determine which content to use based on source selection
    let contentToUse = state.currentContent;
    if (state.sourceType === 'summary' && state.currentSummary) {
      contentToUse = state.currentSummary;
    }
    
    // Request answer from background script
    const response = await chrome.runtime.sendMessage({
      action: 'answerQuestion',
      content: contentToUse,
      summaryContent: state.sourceType === 'summary' ? state.currentSummary : null,
      question: question,
      apiKey: state.apiKey,
      language: state.language,
      answerStyle: state.answerStyle,
      isFollowUp: state.conversationContext.hasContext,
      useStoredContext: state.useStoredContext,
      previousQA: state.conversationContext.previousQA,
      tabId: state.currentTabId
    });
    
    hideLoading();
    
    if (!response.success) {
      showError(elementsById.answerResult, `Error: ${response.error}`);
      return;
    }
    
    // Update state and UI
    state.currentAnswer = response.answer;
    elementsById.answerResult.innerHTML = `<div class="answer-text">${formatTextWithLineBreaks(response.answer)}</div>`;
    
    // Update conversation context
    if (!state.conversationContext.previousQA) {
      state.conversationContext.previousQA = [];
    }
    state.conversationContext.previousQA.push({
      question: question,
      answer: response.answer
    });
    state.conversationContext.hasContext = true;
    state.conversationContext.questionCount = state.conversationContext.previousQA.length;
    
    // Update conversation context in UI
    updateConversationIndicator(state.conversationContext);
    
    // Add to history
    addToHistory({
      type: 'question',
      pageInfo: state.currentPageInfo,
      question: question,
      answer: response.answer,
      timestamp: new Date().toISOString(),
      style: state.answerStyle
    });
    
    // Clear the question input
    elementsById.questionInput.value = '';
    
  } catch (error) {
    hideLoading();
    showError(elementsById.answerResult, `Error: ${error.message}`);
  }
}

/**
 * Extracts content from the current page
 */
async function extractContent() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'extractPageContent' });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    state.currentContent = response.content;
    state.currentPageInfo = response.pageInfo;
    return true;
  } catch (error) {
    console.error('Error extracting content:', error);
    return false;
  }
}

/**
 * Adds an item to history and saves to storage
 * @param {Object} item - History item to add
 */
function addToHistory(item) {
  state.history.unshift(item);
  
  // Limit history size to 50 items
  if (state.history.length > 50) {
    state.history = state.history.slice(0, 50);
  }
  
  // Save to storage and update UI
  chrome.storage.local.set({ history: state.history });
  renderHistory();
}

/**
 * Renders history items in the UI with filtering, grouping, and tagging
 */
function renderHistory() {
  if (state.history.length === 0) {
    elementsById.historyList.innerHTML = '<p class="placeholder">No history yet.</p>';
    updateExportControls();
    return;
  }
  
  // Filter history items based on current filters
  const filteredHistory = state.history.filter(item => {
    // Apply search filter
    if (state.historyFilters.search) {
      const searchLower = state.historyFilters.search.toLowerCase();
      const titleText = item.type === 'summary' 
        ? item.pageInfo?.title || '' 
        : item.question || '';
      const contentText = item.type === 'summary' 
        ? item.content || '' 
        : item.answer || '';
      
      const textContainsSearch = 
        titleText.toLowerCase().includes(searchLower) ||
        contentText.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        
      if (!textContainsSearch) return false;
    }
    
    // Apply website filter
    if (state.historyFilters.website !== 'all') {
      const domain = extractDomain(item.pageInfo?.url || '');
      if (domain !== state.historyFilters.website) return false;
    }
    
    // Apply tag filter
    if (state.historyFilters.tag !== 'all') {
      if (!item.tags || !item.tags.includes(state.historyFilters.tag)) return false;
    }
    
    // Apply type filter
    if (state.historyFilters.type !== 'all' && item.type !== state.historyFilters.type) {
      return false;
    }
    
    return true;
  });

  if (filteredHistory.length === 0) {
    elementsById.historyList.innerHTML = '<p class="placeholder">No matching items found.</p>';
    updateExportControls();
    return;
  }
  
  // Selection controls HTML
  let selectionControlsHtml = '';
  if (state.selectionMode) {
    const selectedCount = state.selectedHistoryItems.length;
    selectionControlsHtml = `
      <div class="selection-controls">
        <div class="selection-info">
          <span>${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected</span>
        </div>
        <div class="selection-actions">
          <button id="select-all-btn" class="small-btn">Select All</button>
          <button id="deselect-all-btn" class="small-btn">Deselect All</button>
          <button id="cancel-selection-btn" class="small-btn">Cancel</button>
        </div>
      </div>
    `;
  } else {
    selectionControlsHtml = `
      <div class="selection-controls">
        <button id="select-items-btn" class="small-btn">Select Items</button>
      </div>
    `;
  }

  // Group history by website domain
  const historyByDomain = {};
  filteredHistory.forEach(item => {
    const domain = extractDomain(item.pageInfo?.url || 'unknown');
    if (!historyByDomain[domain]) {
      historyByDomain[domain] = [];
    }
    historyByDomain[domain].push(item);
  });
  
  // Generate HTML for grouped history items
  let historyHtml = selectionControlsHtml;
  
  Object.keys(historyByDomain).forEach(domain => {
    const domainItems = historyByDomain[domain];
    
    historyHtml += `
      <div class="history-group">
        <div class="history-group-header">
          <span>${domain}</span>
          <span class="history-group-count">${domainItems.length}</span>
        </div>
    `;
    
    domainItems.forEach((item, globalIndex) => {
      const index = state.history.findIndex(h => 
        h.timestamp === item.timestamp && h.type === item.type);
      
      const date = new Date(item.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      let title = '';
      let snippet = '';
      
      if (item.type === 'summary') {
        title = `Summary: ${item.pageInfo?.title || 'Unknown page'}`;
        snippet = item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '');
      } else if (item.type === 'question') {
        title = `Q: ${item.question}`;
        snippet = item.answer.substring(0, 100) + (item.answer.length > 100 ? '...' : '');
        
        // Add style indicator if provided
        if (item.style && item.style !== 'standard') {
          title += ` <span style="font-size:0.8em;color:var(--color-primary);font-style:italic;">(${getStyleDisplayName(item.style)})</span>`;
        }
      }
      
      const tagsHtml = item.tags && item.tags.length > 0 
        ? `
          <div class="history-tag-container">
            ${item.tags.map(tag => `<span class="history-tag" data-tag="${tag}">${tag}</span>`).join('')}
          </div>
        ` 
        : '';
      
      // Add checkbox for selection mode
      const checkboxHtml = state.selectionMode ? `
        <div class="selection-checkbox">
          <input type="checkbox" id="select-item-${index}" 
            ${state.selectedHistoryItems.includes(index) ? 'checked' : ''}>
          <label for="select-item-${index}"></label>
        </div>
      ` : '';
      
      historyHtml += `
        <div class="history-item ${state.selectionMode ? 'selection-mode' : ''}" data-index="${index}">
          ${checkboxHtml}
          <div class="history-item-content">
            <div class="timestamp">${formattedDate}</div>
            <div class="title">${title}</div>
            <div class="snippet">${snippet}</div>
            ${tagsHtml}
          </div>
          <button class="history-options-button" data-index="${index}" aria-label="Item options">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
        </div>
      `;
    });
    
    historyHtml += `</div>`;
  });
  
  elementsById.historyList.innerHTML = historyHtml;
  
  // Add click event listeners for selection controls
  if (state.selectionMode) {
    document.getElementById('select-all-btn').addEventListener('click', selectAllHistoryItems);
    document.getElementById('deselect-all-btn').addEventListener('click', deselectAllHistoryItems);
    document.getElementById('cancel-selection-btn').addEventListener('click', toggleSelectionMode);
    
    // Add click events to checkboxes
    document.querySelectorAll('.selection-checkbox input').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const index = parseInt(checkbox.id.replace('select-item-', ''));
        toggleHistoryItemSelection(index);
      });
    });
  } else {
    document.getElementById('select-items-btn').addEventListener('click', toggleSelectionMode);
  }
  
  // Add click events to history items
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // If we're in selection mode, handle selection
      if (state.selectionMode) {
        // If we clicked directly on the checkbox, let the checkbox handler do its thing
        if (e.target.type === 'checkbox') return;
        
        // Otherwise toggle the checkbox
        const index = parseInt(item.dataset.index);
        toggleHistoryItemSelection(index);
        const checkbox = document.getElementById(`select-item-${index}`);
        if (checkbox) {
          checkbox.checked = state.selectedHistoryItems.includes(index);
        }
        return;
      }
      
      // If not in selection mode and we clicked on a button or tag inside the item, don't show details
      if (e.target.closest('.history-options-button') || e.target.closest('.history-tag')) {
        return;
      }
      
      showHistoryItemDetails(parseInt(item.dataset.index));
    });
  });
  
  // Add click events to history tags
  document.querySelectorAll('.history-tag').forEach(tag => {
    tag.addEventListener('click', (e) => {
      e.stopPropagation();
      state.historyFilters.tag = tag.dataset.tag;
      updateHistoryFilters();
      renderHistory();
    });
  });
  
  // Add click events to options buttons
  document.querySelectorAll('.history-options-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      showItemOptions(button, parseInt(button.dataset.index));
    });
  });
  
  // Update export button state based on selection
  updateExportControls();
}

/**
 * Returns a user-friendly display name for an answer style
 * @param {string} style - The style identifier
 * @returns {string} User-friendly style name
 */
function getStyleDisplayName(style) {
  const styleNames = {
    'standard': 'Standard',
    'simple': 'Simple',
    'technical': 'Technical',
    'eli5': 'ELI5',
    'code-focused': 'Code-focused'
  };
  return styleNames[style] || style;
}

/**
 * Extracts domain from URL and truncates if too long
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain, truncated if needed
 */
function extractDomain(url) {
  try {
    if (!url) return 'unknown';
    const domain = new URL(url).hostname;
    // Truncate domain if it's too long (more than 25 characters)
    return domain.length > 25 ? domain.substring(0, 22) + '...' : domain;
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Truncates a URL for display purposes
 * @param {string} url - The URL to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated URL
 */
function truncateUrl(url, maxLength = 40) {
  if (!url) return 'Unknown URL';
  if (url.length <= maxLength) return url;
  
  // Keep the protocol and domain, truncate the path
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const protocol = urlObj.protocol + '//';
    const path = url.substring(protocol.length + domain.length);
    
    if (domain.length > maxLength - 10) {
      // Domain itself is too long
      return domain.substring(0, maxLength - 13) + '...' + domain.substring(domain.length - 7);
    }
    
    // Calculate how much of the path we can show
    const availableLength = maxLength - protocol.length - domain.length - 3; // 3 for ellipsis
    if (availableLength <= 5) {
      // Not enough space for meaningful path truncation
      return protocol + domain + '/...';
    }
    
    return protocol + domain + '/' + 
      (path.length > availableLength ? 
        '...' + path.substring(path.length - availableLength) : 
        path.substring(1));
  } catch (error) {
    // Fall back to simple truncation if URL parsing fails
    return url.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Shows options menu for a history item
 * @param {Element} button - The button that was clicked
 * @param {number} index - Index of the history item
 */
function showItemOptions(button, index) {
  // Remove any existing options menus
  document.querySelectorAll('.tag-options').forEach(menu => menu.remove());
  
  const item = state.history[index];
  const optionsMenu = document.createElement('div');
  optionsMenu.className = 'tag-options';
  optionsMenu.innerHTML = `
    <div class="tag-option add-tag-option">Add Tag</div>
    <div class="tag-option delete-option">Delete</div>
  `;
  
  button.parentNode.appendChild(optionsMenu);
  
  // Add tag option
  optionsMenu.querySelector('.add-tag-option').addEventListener('click', () => {
    showAddTagUI(button, index);
  });
  
  // Delete option
  optionsMenu.querySelector('.delete-option').addEventListener('click', () => {
    deleteHistoryItem(index);
  });
  
  // Close menu when clicking elsewhere
  document.addEventListener('click', function closeMenu(e) {
    if (!optionsMenu.contains(e.target) && e.target !== button) {
      optionsMenu.remove();
      document.removeEventListener('click', closeMenu);
    }
  });
}

/**
 * Shows UI for adding a tag to a history item
 * @param {Element} button - The button that was clicked
 * @param {number} index - Index of the history item
 */
function showAddTagUI(button, index) {
  // Remove any existing tag input containers
  document.querySelectorAll('.tag-input-container').forEach(container => container.remove());
  document.querySelectorAll('.tag-options').forEach(menu => menu.remove());
  
  const tagInputContainer = document.createElement('div');
  tagInputContainer.className = 'tag-input-container';
  tagInputContainer.innerHTML = `
    <input type="text" class="tag-input" placeholder="Enter a tag...">
    <button class="add-tag-btn">Add</button>
  `;
  
  button.parentNode.appendChild(tagInputContainer);
  const input = tagInputContainer.querySelector('.tag-input');
  input.focus();
  
  // Handle tag addition
  tagInputContainer.querySelector('.add-tag-btn').addEventListener('click', () => {
    addTagToItem(index, input.value.trim());
    tagInputContainer.remove();
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTagToItem(index, input.value.trim());
      tagInputContainer.remove();
    }
  });
  
  // Close when clicking elsewhere
  document.addEventListener('click', function closeTagInput(e) {
    if (!tagInputContainer.contains(e.target) && e.target !== button) {
      tagInputContainer.remove();
      document.removeEventListener('click', closeTagInput);
    }
  });
}

/**
 * Adds a tag to a history item
 * @param {number} index - Index of the history item
 * @param {string} tag - The tag to add
 */
function addTagToItem(index, tag) {
  if (!tag) return;
  
  // Initialize tags array if it doesn't exist
  if (!state.history[index].tags) {
    state.history[index].tags = [];
  }
  
  // Don't add duplicate tags
  if (state.history[index].tags.includes(tag)) {
    showToast(`Tag "${tag}" already exists on this item`, 'error');
    return;
  }
  
  // Add tag to history item
  state.history[index].tags.push(tag);
  
  // Add to available tags if not already present
  if (!state.availableTags.includes(tag)) {
    state.availableTags.push(tag);
    updateTagFilter();
  }
  
  // Save changes and update UI
  chrome.storage.local.set({ 
    history: state.history,
    availableTags: state.availableTags 
  });
  
  showToast(`Added tag "${tag}"`);
  renderHistory();
}

/**
 * Removes a tag from a history item
 * @param {number} index - Index of the history item
 * @param {string} tag - The tag to remove
 */
function removeTagFromItem(index, tag) {
  if (!state.history[index].tags) return;
  
  // Remove tag from history item
  state.history[index].tags = state.history[index].tags.filter(t => t !== tag);
  
  // Check if tag is still used by any item
  const tagStillInUse = state.history.some(item => item.tags && item.tags.includes(tag));
  if (!tagStillInUse) {
    state.availableTags = state.availableTags.filter(t => t !== tag);
    updateTagFilter();
  }
  
  // Save changes and update UI
  chrome.storage.local.set({ 
    history: state.history,
    availableTags: state.availableTags 
  });
  
  showToast(`Removed tag "${tag}"`);
  renderHistory();
}

/**
 * Deletes a history item
 * @param {number} index - Index of the history item to delete
 */
function deleteHistoryItem(index) {
  const item = state.history[index];
  if (!item) return;
  
  // Remove the item
  state.history.splice(index, 1);
  
  // Update available tags if needed
  if (item.tags && item.tags.length > 0) {
    // For each tag, check if it's still used
    item.tags.forEach(tag => {
      const tagStillInUse = state.history.some(item => item.tags && item.tags.includes(tag));
      if (!tagStillInUse) {
        state.availableTags = state.availableTags.filter(t => t !== tag);
      }
    });
    updateTagFilter();
  }
  
  // Save changes and update UI
  chrome.storage.local.set({ 
    history: state.history,
    availableTags: state.availableTags 
  });
  
  showToast('Item deleted');
  renderHistory();
}

/**
 * Clears all history items
 */
function clearHistory() {
  if (confirm('Are you sure you want to clear all history items?')) {
    state.history = [];
    state.availableTags = [];
    chrome.storage.local.set({ 
      history: [],
      availableTags: []
    });
    renderHistory();
    updateHistoryFilters();
    showToast('History cleared');
  }
}

/**
 * Updates history filters based on available data
 */
function updateHistoryFilters() {
  // Get website filter element
  const websiteFilter = document.getElementById('history-website-filter');
  if (websiteFilter) {
    // Clear existing options
    websiteFilter.innerHTML = '<option value="all">All Websites</option>';
    
    // Get all unique domains from history
    const domains = new Set();
    state.history.forEach(item => {
      const domain = extractDomain(item.pageInfo?.url || '');
      if (domain) domains.add(domain);
    });
    
    // Add domain options to filter
    domains.forEach(domain => {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain;
      option.selected = domain === state.historyFilters.website;
      websiteFilter.appendChild(option);
    });
    
    // Add change event listener
    websiteFilter.addEventListener('change', () => {
      state.historyFilters.website = websiteFilter.value;
      renderHistory();
    });
  }
  
  updateTagFilter();
}

/**
 * Updates tag filter based on available tags
 */
function updateTagFilter() {
  // Get tag filter element
  const tagFilter = document.getElementById('history-tag-filter');
  if (tagFilter) {
    // Clear existing options
    tagFilter.innerHTML = '<option value="all">All Tags</option>';
    
    // Add unique tags from history
    state.availableTags.forEach(tag => {
      const option = document.createElement('option');
      option.value = tag;
      option.textContent = tag;
      option.selected = tag === state.historyFilters.tag;
      tagFilter.appendChild(option);
    });
    
    // Add change event listener
    tagFilter.addEventListener('change', () => {
      state.historyFilters.tag = tagFilter.value;
      renderHistory();
    });
  }
}

/**
 * Initializes history filter controls
 */
function initHistoryFilters() {
  // Search filter
  const searchInput = document.getElementById('history-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.historyFilters.search = searchInput.value.trim();
      renderHistory();
    });
  }
  
  // Type filter
  const typeFilter = document.getElementById('history-type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      state.historyFilters.type = typeFilter.value;
      renderHistory();
    });
  }
  
  // Initialize website and tag filters
  updateHistoryFilters();
}

/**
 * Exports current summary to PDF with proper page breaks to prevent text slicing
 */
function exportSummaryToPdf() {
  try {
    if (!state.currentSummary) {
      showToast('No summary to export', 'error');
      return;
    }
    
    const doc = new jspdf.jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - (margin * 2);
    let yPos = margin;
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136); // Primary color
    
    const pageTitle = state.currentPageInfo?.title || 'Page Summary';
    doc.text('Summary: ' + pageTitle, margin, yPos);
    yPos += 10;
    
    // Add url
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const pageUrl = state.currentPageInfo?.url || '';
    doc.text(pageUrl, margin, yPos);
    yPos += 5;
    
    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, margin, yPos);
    yPos += 10;
    
    // Add summary text with smart pagination
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const summaryText = state.currentSummary;
    
    // Break the text into paragraphs
    const paragraphs = summaryText.split('\n\n');
    
    // Process each paragraph
    paragraphs.forEach((paragraph, index) => {
      // Split text to fit page width
      const splitText = doc.splitTextToSize(paragraph, usableWidth);
      
      // Calculate the height needed for this text block
      const textHeight = splitText.length * doc.getTextDimensions('M').h * 1.2;
      
      // Check if we need a new page
      if (yPos + textHeight > pageHeight - margin * 3) {
        doc.addPage();
        yPos = margin + 10; // Reset Y position with some padding
      }
      
      // Add text
      doc.text(splitText, margin, yPos);
      yPos += textHeight + 5; // Add spacing between paragraphs
    });
    
    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Page Resumer', margin, pageHeight - margin);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - margin, {
        align: 'right'
      });
    }
    
    // Save the PDF
    doc.save(`page_summary_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Summary exported to PDF successfully!');
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    showToast('Error creating PDF: ' + error.message, 'error');
  }
}

/**
 * Exports all history items to PDF with proper page breaks to prevent text slicing
 */
function exportHistoryToPdf() {
  try {
    if (state.history.length === 0) {
      showToast('No history items to export', 'error');
      return;
    }

    // In selection mode, check if there are selected items
    if (state.selectionMode && state.selectedHistoryItems.length === 0) {
      showToast('Please select items to export', 'error');
      return;
    }

    const doc = new jspdf.jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - (margin * 2);
    let yPos = margin;
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(13, 148, 136); // Primary color
    doc.text('Page Resumer - History', margin, yPos);
    yPos += 10;
    
    // Add current date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${currentDate}`, margin, yPos);
    yPos += 15;

    // Determine which items to export
    let itemsToExport = [];
    if (state.selectionMode) {
      // Only export selected items
      itemsToExport = state.selectedHistoryItems.map(index => state.history[index]).filter(Boolean);
    } else {
      // Export all items
      itemsToExport = state.history;
    }
    
    // Add history items
    itemsToExport.forEach((item, itemIndex) => {
      // Always start new items with enough space for the header
      // If there's not enough space, add a new page
      const headerHeight = 40; // Approximate space needed for title, URL, and date
      
      if (yPos + headerHeight > pageHeight - margin * 3) {
        doc.addPage();
        yPos = margin + 10;
      }
      
      // Item header - title
      doc.setFontSize(14);
      doc.setTextColor(13, 148, 136); // Primary color
      
      if (item.type === 'summary') {
        doc.text(`Summary: ${item.pageInfo?.title || 'Unknown page'}`, margin, yPos);
      } else {
        doc.text(`Question: ${item.question}`, margin, yPos);
      }
      
      yPos += 8;
      
      // Add URL
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(item.pageInfo?.url || 'Unknown URL', margin, yPos);
      
      yPos += 5;
      
      // Add timestamp
      const date = new Date(item.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      doc.text(formattedDate, margin, yPos);
      
      yPos += 8;
      
      // Add content with smart pagination
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      const contentText = item.type === 'summary' ? item.content : 
        `Q: ${item.question}\n\nA: ${item.answer}`;
      
      // Split content into paragraphs for better handling
      const paragraphs = contentText.split('\n\n');
      
      // Process each paragraph
      paragraphs.forEach((paragraph, paraIndex) => {
        // Split text to fit page width
        const splitText = doc.splitTextToSize(paragraph, usableWidth);
        
        // Calculate height needed for this text block
        const lineHeight = doc.getTextDimensions('M').h * 1.2;
        const textHeight = splitText.length * lineHeight;
        
        // Check if we need a new page
        if (yPos + textHeight > pageHeight - margin * 3) {
          doc.addPage();
          yPos = margin + 10; // Reset Y position with some padding
        }
        
        // Add text
        doc.text(splitText, margin, yPos);
        yPos += textHeight + 5; // Add spacing between paragraphs
      });
      
      // Only add separator and spacing if this isn't the last item
      if (itemIndex < itemsToExport.length - 1) {
        // Check if there's enough space for separator + minimum gap
        const separatorHeight = 15;
        
        if (yPos + separatorHeight > pageHeight - margin * 3) {
          doc.addPage();
          yPos = margin + 10;
        } else {
          // Add separator
          doc.setDrawColor(200, 200, 200); // Light gray
          doc.setLineWidth(0.2);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 15; // Space after separator
        }
      }
    });
    
    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Page Resumer', margin, pageHeight - margin);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - margin, {
        align: 'right'
      });
    }
    
    // Save the PDF with appropriate filename
    let filename = 'page_resumer_history';
    if (state.selectionMode) {
      filename += `_selected_${state.selectedHistoryItems.length}_items`;
    }
    filename += `_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    doc.save(filename);
    showToast(`${state.selectionMode ? 'Selected' : 'All'} history items exported to PDF successfully!`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    showToast('Error creating PDF: ' + error.message, 'error');
  }
}

/**
 * Validates the API key format
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} Whether the API key appears valid
 */
function validateApiKey(apiKey) {
  // Basic validation - Gemini API keys usually follow a certain pattern
  // This is a basic check that can be enhanced
  if (!apiKey || apiKey.length < 10) {
    return false;
  }
  
  return true;
}

/**
 * Shows a toast notification
 * @param {string} message - The message to show
 * @param {string} type - The type of toast (success or error)
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  
  toast.className = 'toast';
  toast.classList.add(type);
  toast.classList.add('active');
  toastMessage.textContent = message;
  
  setTimeout(() => {
    toast.classList.remove('active');
  }, 3000);
}

/**
 * Saves the API key to storage
 */
async function saveApiKey() {
  const apiKey = elementsById.apiKeyInput.value.trim();
  
  if (!validateApiKey(apiKey)) {
    showToast('Please enter a valid API key. API keys should be at least 10 characters long.', 'error');
    return;
  }
  
  state.apiKey = apiKey;
  await chrome.storage.local.set({ apiKey });
  showToast('API key saved successfully!');
}

/**
 * Completes the initial setup
 */
async function completeSetup() {
  const apiKey = elementsById.setupApiKey.value.trim();
  
  if (!validateApiKey(apiKey)) {
    showToast('Please enter a valid API key to continue. API keys should be at least 10 characters long.', 'error');
    return;
  }
  
  state.apiKey = apiKey;
  await chrome.storage.local.set({ apiKey });
  elementsById.apiKeyInput.value = apiKey;
  elementsById.setupOverlay.classList.remove('active');
  showToast('Setup completed successfully!');
}

/**
 * Changes the language preference
 */
async function changeLanguage() {
  elementsById.languageRadios.forEach(radio => {
    if (radio.checked) {
      state.language = radio.value;
    }
  });
  
  await chrome.storage.local.set({ language: state.language });
  showToast(`Language changed to ${state.language === 'en' ? 'English' : 'Indonesian'}`);
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 */
async function copyText(text) {
  if (!text) return;
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy:', error);
    
    // Fallback method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard!');
  }
}

/**
 * Shows loading overlay
 */
function showLoading() {
  elementsById.loadingOverlay.classList.add('active');
}

/**
 * Hides loading overlay
 */
function hideLoading() {
  elementsById.loadingOverlay.classList.remove('active');
}

/**
 * Displays an error message in a container
 * @param {Element} container - The container to show the error in
 * @param {string} message - The error message
 */
function showError(container, message) {
  container.innerHTML = `<p class="error">${message}</p>`;
}

/**
 * Formats text with HTML line breaks and styles
 * @param {string} text - The text to format
 * @returns {string} Formatted HTML
 */
function formatTextWithLineBreaks(text) {
  if (!text) return '';
  
  // Convert text wrapped in double asterisks to bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/(<p>)*/, '<p>')
    .replace(/(<\/p>)*$/, '</p>');
}

/**
 * Toggles between light and dark theme
 */
async function toggleTheme() {
  // Toggle theme
  const newTheme = state.theme === 'light' ? 'dark' : 'light';
  
  // Save theme preference
  state.theme = newTheme;
  await chrome.storage.local.set({ theme: newTheme });
  
  // Apply the theme
  applyTheme(newTheme);
  
  // Show feedback to user
  showToast(`Theme switched to ${newTheme} mode`);
}

/**
 * Applies theme to the extension UI
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

/**
 * Shows details of a history item in a modal
 * @param {number} index - Index of the history item
 */
function showHistoryItemDetails(index) {
  const item = state.history[index];
  if (!item) return;
  
  // Create a modal for displaying the history item details
  const modal = document.createElement('div');
  modal.className = 'overlay active';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.zIndex = '1000';
  
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'var(--color-surface)';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.width = '90%';
  modalContent.style.maxHeight = '80%';
  modalContent.style.overflow = 'auto';
  modalContent.style.position = 'relative';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.right = '10px';
  closeBtn.style.top = '10px';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = 'var(--color-text)';
  closeBtn.style.padding = '0 8px';
  
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  const date = new Date(item.timestamp);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  
  let headerText = '';
  let contentText = '';
  
  if (item.type === 'summary') {
    headerText = `Summary: ${item.pageInfo?.title || 'Unknown page'}`;
    contentText = item.content;
  } else if (item.type === 'question') {
    headerText = `Q: ${item.question}`;
    contentText = item.answer;
  }
  
  // Create modal content
  modalContent.innerHTML += `
    <h3 style="margin-top: 0; margin-bottom: 10px; padding-right: 30px;">${headerText}</h3>
    <div style="color: var(--color-text-light); font-size: 12px; margin-bottom: 10px;">
      ${formattedDate}
    </div>
    <div style="margin-bottom: 10px;">
      <a href="${item.pageInfo?.url}" target="_blank" style="color: var(--color-primary); text-decoration: none;">
        ${item.pageInfo?.url || 'Unknown URL'}
      </a>
    </div>
    <div style="background-color: var(--color-bg); padding: 12px; border-radius: 8px; margin-bottom: 10px; white-space: pre-wrap;">
      ${contentText}
    </div>
  `;
  
  // Tag management area
  const tagContainer = document.createElement('div');
  tagContainer.style.marginTop = '15px';
  
  // Display existing tags
  const tagsDisplay = document.createElement('div');
  tagsDisplay.className = 'history-tag-container';
  tagsDisplay.style.marginBottom = '10px';
  
  if (item.tags && item.tags.length > 0) {
    item.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'history-tag';
      tagSpan.textContent = tag;
      tagSpan.style.position = 'relative';
      tagSpan.style.paddingRight = '20px';
      
      const removeBtn = document.createElement('span');
      removeBtn.innerHTML = '×';
      removeBtn.style.position = 'absolute';
      removeBtn.style.right = '5px';
      removeBtn.style.top = '0';
      removeBtn.style.cursor = 'pointer';
      
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTagFromItem(index, tag);
        document.body.removeChild(modal);
        showHistoryItemDetails(index);
      });
      
      tagSpan.appendChild(removeBtn);
      tagsDisplay.appendChild(tagSpan);
    });
  } else {
    const noTagsMsg = document.createElement('span');
    noTagsMsg.style.color = 'var(--color-text-light)';
    noTagsMsg.style.fontSize = '12px';
    noTagsMsg.textContent = 'No tags added yet';
    tagsDisplay.appendChild(noTagsMsg);
  }
  
  tagContainer.appendChild(tagsDisplay);
  
  // Add tag input
  const tagInput = document.createElement('div');
  tagInput.className = 'tag-input-container';
  tagInput.style.display = 'flex';
  tagInput.style.alignItems = 'center';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tag-input';
  input.placeholder = 'Add a new tag...';
  input.style.flex = '1';
  
  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add';
  addBtn.className = 'add-tag-btn';
  addBtn.style.marginLeft = '8px';
  
  tagInput.appendChild(input);
  tagInput.appendChild(addBtn);
  tagContainer.appendChild(tagInput);
  
  // Add click handler for the add button
  addBtn.addEventListener('click', () => {
    const tagText = input.value.trim();
    if (tagText) {
      addTagToItem(index, tagText);
      input.value = '';
      document.body.removeChild(modal);
      showHistoryItemDetails(index);
    }
  });
  
  // Enter key handler
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const tagText = input.value.trim();
      if (tagText) {
        addTagToItem(index, tagText);
        input.value = '';
        document.body.removeChild(modal);
        showHistoryItemDetails(index);
      }
    }
  });
  
  // Add action buttons
  const actionButtons = document.createElement('div');
  actionButtons.style.display = 'flex';
  actionButtons.style.justifyContent = 'space-between';
  actionButtons.style.marginTop = '15px';
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'secondary-btn';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    copyText(contentText);
  });
  
  // If the item is a summary, add a button to ask a question about it
  if (item.type === 'summary') {
    const askAboutBtn = document.createElement('button');
    askAboutBtn.className = 'secondary-btn';
    askAboutBtn.textContent = 'Ask question';
    askAboutBtn.addEventListener('click', () => {
      // Switch to the Ask AI tab
      switchTab('ask');
      // Set source to summary
      document.querySelector('input[name="source"][value="summary"]').checked = true;
      state.sourceType = 'summary';
      state.useStoredContext = true;
      state.currentSummary = item.content;
      state.currentPageInfo = item.pageInfo;
      // Show source selector
      elementsById.sourceSelector.classList.remove('hidden');
      // Prepare a question about the summary
      elementsById.questionInput.value = 'Can you analyze this summary and tell me the key points?';
      elementsById.questionInput.focus();
      // Close the modal
      document.body.removeChild(modal);
    });
    actionButtons.appendChild(askAboutBtn);
  }
  
  const closeModalBtn = document.createElement('button');
  closeModalBtn.className = 'secondary-btn';
  closeModalBtn.textContent = 'Close';
  closeModalBtn.addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  actionButtons.appendChild(copyBtn);
  actionButtons.appendChild(closeModalBtn);
  
  // Assemble the modal
  modalContent.appendChild(closeBtn);
  modalContent.appendChild(tagContainer);
  modalContent.appendChild(actionButtons);
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Close when clicking outside the modal content
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

/**
 * Toggles selection mode for history items
 */
function toggleSelectionMode() {
  state.selectionMode = !state.selectionMode;
  
  // Clear selections when exiting selection mode
  if (!state.selectionMode) {
    state.selectedHistoryItems = [];
  }
  
  renderHistory();
}

/**
 * Toggles selection of a specific history item
 * @param {number} index - The index of the history item to toggle
 */
function toggleHistoryItemSelection(index) {
  const selectionIndex = state.selectedHistoryItems.indexOf(index);
  if (selectionIndex === -1) {
    // Item is not selected, add it to selection
    state.selectedHistoryItems.push(index);
  } else {
    // Item is already selected, remove it from selection
    state.selectedHistoryItems.splice(selectionIndex, 1);
  }
  
  // Update selection count display
  updateSelectionCountDisplay();
  
  // Update export controls
  updateExportControls();
}

/**
 * Updates the selection count display in the UI
 */
function updateSelectionCountDisplay() {
  if (!state.selectionMode) return;
  
  const selectionInfoElement = document.querySelector('.selection-info span');
  if (selectionInfoElement) {
    const selectedCount = state.selectedHistoryItems.length;
    selectionInfoElement.textContent = `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`;
  }
}

/**
 * Selects all currently visible history items
 */
function selectAllHistoryItems() {
  // Filter history items based on current filters
  const filteredHistory = state.history.filter(item => {
    // Apply search filter
    if (state.historyFilters.search) {
      const searchLower = state.historyFilters.search.toLowerCase();
      const titleText = item.type === 'summary' 
        ? item.pageInfo?.title || '' 
        : item.question || '';
      const contentText = item.type === 'summary' 
        ? item.content || '' 
        : item.answer || '';
      
      const textContainsSearch = 
        titleText.toLowerCase().includes(searchLower) ||
        contentText.toLowerCase().includes(searchLower) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        
      if (!textContainsSearch) return false;
    }
    
    // Apply website filter
    if (state.historyFilters.website !== 'all') {
      const domain = extractDomain(item.pageInfo?.url || '');
      if (domain !== state.historyFilters.website) return false;
    }
    
    // Apply tag filter
    if (state.historyFilters.tag !== 'all') {
      if (!item.tags || !item.tags.includes(state.historyFilters.tag)) return false;
    }
    
    // Apply type filter
    if (state.historyFilters.type !== 'all' && item.type !== state.historyFilters.type) {
      return false;
    }
    
    return true;
  });
  
  // Get indices of filtered items
  state.selectedHistoryItems = filteredHistory.map(item => 
    state.history.findIndex(h => h.timestamp === item.timestamp && h.type === item.type)
  ).filter(index => index !== -1); // Remove any -1 values
  
  // Update checkboxes
  document.querySelectorAll('.selection-checkbox input').forEach(checkbox => {
    const index = parseInt(checkbox.id.replace('select-item-', ''));
    checkbox.checked = state.selectedHistoryItems.includes(index);
  });
  
  updateExportControls();
  renderHistory();
}

/**
 * Deselects all history items
 */
function deselectAllHistoryItems() {
  state.selectedHistoryItems = [];
  
  // Update checkboxes
  document.querySelectorAll('.selection-checkbox input').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  updateExportControls();
  renderHistory();
}

  // Fully hide the setup overlay using multiple approaches to ensure it's hidden
  const setupOverlay = elementsById.setupOverlay;
  setupOverlay.classList.remove('active');
  setupOverlay.style.opacity = '0';
  setupOverlay.style.visibility = 'hidden';
  setupOverlay.style.pointerEvents = 'none';
  
  showToast('Setup completed!');

/**
 * Updates the export controls based on selection state
 */
function updateExportControls() {
  const exportBtn = document.getElementById('export-history-pdf');
  
  if (!exportBtn) return;
  
  if (state.selectionMode && state.selectedHistoryItems.length > 0) {
    exportBtn.textContent = `Export Selected (${state.selectedHistoryItems.length})`;
    exportBtn.disabled = false;
  } else if (state.selectionMode) {
    exportBtn.textContent = 'Export Selected';
    exportBtn.disabled = true;
  } else {
    exportBtn.textContent = 'Export PDF';
    exportBtn.disabled = state.history.length === 0;
  }
}