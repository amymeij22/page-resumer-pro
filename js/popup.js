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
    completeSetupBtn: document.getElementById('complete-setup')
  };
  
  // State management
  let state = {
    currentContent: '',
    currentPageInfo: null,
    currentSummary: '',
    currentAnswer: '',
    apiKey: '',
    language: 'en',
    history: []
  };
  
  // Initialize popup
  document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadHistory();
    initializeUi();
    
    // Show setup overlay if no API key is stored
    if (!state.apiKey) {
      elementsById.setupOverlay.classList.add('active');
    }
  });
  
  /**
   * Loads saved settings from Chrome storage
   */
  async function loadSettings() {
    try {
      const result = await chrome.storage.local.get(['apiKey', 'language']);
      state.apiKey = result.apiKey || '';
      state.language = result.language || 'en';
      
      // Update UI based on loaded settings
      elementsById.apiKeyInput.value = state.apiKey;
      document.querySelector(`input[name="language"][value="${state.language}"]`).checked = true;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  /**
   * Loads summary/answer history from Chrome storage
   */
  async function loadHistory() {
    try {
      const result = await chrome.storage.local.get(['history']);
      state.history = result.history || [];
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
    
    // Setup
    elementsById.completeSetupBtn.addEventListener('click', completeSetup);
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
      
      // Request answer from background script
      const response = await chrome.runtime.sendMessage({
        action: 'answerQuestion',
        content: state.currentContent,
        question: question,
        apiKey: state.apiKey,
        language: state.language
      });
      
      hideLoading();
      
      if (!response.success) {
        showError(elementsById.answerResult, `Error: ${response.error}`);
        return;
      }
      
      // Update state and UI
      state.currentAnswer = response.answer;
      elementsById.answerResult.innerHTML = `<div class="answer-text">${formatTextWithLineBreaks(response.answer)}</div>`;
      
      // Add to history
      addToHistory({
        type: 'question',
        pageInfo: state.currentPageInfo,
        question: question,
        answer: response.answer,
        timestamp: new Date().toISOString()
      });
      
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
   * Renders history items in the UI
   */
  function renderHistory() {
    if (state.history.length === 0) {
      elementsById.historyList.innerHTML = '<p class="placeholder">No history yet.</p>';
      return;
    }
    
    let historyHtml = '';
    
    state.history.forEach((item, index) => {
      const date = new Date(item.timestamp);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      let title = '';
      let snippet = '';
      
      if (item.type === 'summary') {
        title = `Summary: ${item.pageInfo?.title || 'Unknown page'}`;
        snippet = item.content.substring(0, 100) + '...';
      } else if (item.type === 'question') {
        title = `Q: ${item.question}`;
        snippet = item.answer.substring(0, 100) + '...';
      }
      
      historyHtml += `
        <div class="history-item" data-index="${index}">
          <div class="timestamp">${formattedDate}</div>
          <div class="title">${title}</div>
          <div class="snippet">${snippet}</div>
        </div>
      `;
    });
    
    elementsById.historyList.innerHTML = historyHtml;
    
    // Add click events to history items
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => showHistoryItemDetails(parseInt(item.dataset.index)));
    });
  }
  
  /**
   * Shows details of a history item in a modal
   * @param {number} index - Index of the history item to show
   */
  function showHistoryItemDetails(index) {
    const item = state.history[index];
    
    if (item.type === 'summary') {
      switchTab('summarize');
      elementsById.summaryResult.innerHTML = `<div class="summary-text">${formatTextWithLineBreaks(item.content)}</div>`;
      state.currentSummary = item.content;
    } else if (item.type === 'question') {
      switchTab('ask');
      elementsById.questionInput.value = item.question;
      elementsById.answerResult.innerHTML = `<div class="answer-text">${formatTextWithLineBreaks(item.answer)}</div>`;
      state.currentAnswer = item.answer;
    }
  }
  
  /**
   * Clears all history items
   */
  async function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
      state.history = [];
      await chrome.storage.local.set({ history: [] });
      renderHistory();
    }
  }
  
  /**
   * Exports current summary to PDF
   */
  function exportSummaryToPdf() {
    if (!state.currentSummary) {
      showToast('No summary to export.', 'error');
      return;
    }
    
    try {
      const doc = new jspdf.jsPDF();
      const pageTitle = state.currentPageInfo?.title || 'Untitled Page';
      const pageUrl = state.currentPageInfo?.url || '';
      const date = new Date().toLocaleString();
      
      // Add title with styling
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Primary color
      doc.text('Page Resumer: Summary', 10, 20);
      
      // Add metadata with styling
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // Dark blue
      doc.text(`Page: ${pageTitle}`, 10, 30);
      doc.text(`URL: ${pageUrl}`, 10, 38);
      doc.text(`Date: ${date}`, 10, 46);
      
      // Add line separator
      doc.setDrawColor(59, 130, 246); // Primary color
      doc.setLineWidth(0.5);
      doc.line(10, 50, 200, 50);
      
      // Add summary content with proper line wrapping
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(state.currentSummary, 180);
      
      // Check if content will overflow to new page
      if (splitText.length > 45) {
        doc.text(splitText.slice(0, 45), 10, 60);
        
        let currentPage = 1;
        for (let i = 45; i < splitText.length; i += 55) {
          doc.addPage();
          currentPage++;
          doc.text(splitText.slice(i, i + 55), 10, 20);
        }
      } else {
        doc.text(splitText, 10, 60);
      }
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by Page Resumer | Page ${i} of ${pageCount}`, 10, 285);
      }
      
      // Save the PDF with a clean filename
      const cleanTitle = pageTitle.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`summary_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      showToast('Summary exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showToast('Error creating PDF: ' + error.message, 'error');
    }
  }
  
  /**
   * Exports all history items to PDF
   */
  function exportHistoryToPdf() {
    if (state.history.length === 0) {
      showToast('No history to export.', 'error');
      return;
    }
    
    try {
      const doc = new jspdf.jsPDF();
      const date = new Date().toLocaleString();
      let yPos = 20;
      
      // Add title with styling
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246); // Primary color
      doc.text('Page Resumer: History Export', 10, yPos);
      yPos += 10;
      
      // Add date
      doc.setFontSize(12);
      doc.setTextColor(30, 58, 138); // Dark blue
      doc.text(`Exported on: ${date}`, 10, yPos);
      yPos += 10;
      
      // Add line separator
      doc.setDrawColor(59, 130, 246); // Primary color
      doc.setLineWidth(0.5);
      doc.line(10, yPos, 200, yPos);
      yPos += 10;
      
      // Process each history item
      state.history.forEach((item, index) => {
        const itemDate = new Date(item.timestamp).toLocaleString();
        
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Add item header
        doc.setTextColor(59, 130, 246); // Primary color
        doc.setFontSize(14);
        let headerText = '';
        if (item.type === 'summary') {
          headerText = `Summary #${index + 1}: ${item.pageInfo?.title || 'Unknown page'}`;
        } else {
          headerText = `Question #${index + 1}: ${item.question}`;
        }
        
        // Check if header is too long and needs wrapping
        const headerLines = doc.splitTextToSize(headerText, 180);
        doc.text(headerLines, 10, yPos);
        yPos += headerLines.length * 7;
        
        // Add timestamp
        doc.setTextColor(100, 100, 100); // Gray
        doc.setFontSize(10);
        doc.text(`Date: ${itemDate}`, 10, yPos);
        yPos += 8;
        
        // Add content
        doc.setTextColor(0, 0, 0); // Black
        doc.setFontSize(11);
        const content = item.type === 'summary' ? item.content : item.answer;
        const splitText = doc.splitTextToSize(content, 180);
        
        // Check if content will overflow to new page
        if (yPos + splitText.length * 5 > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.text(splitText, 10, yPos);
        yPos += splitText.length * 5 + 15;
        
        // Add separator
        doc.setDrawColor(200, 200, 200); // Light gray
        doc.setLineWidth(0.2);
        doc.line(10, yPos - 10, 200, yPos - 10);
      });
      
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated by Page Resumer | Page ${i} of ${pageCount}`, 10, 285);
      }
      
      // Save the PDF
      doc.save(`page_resumer_history_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('History exported to PDF successfully!');
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