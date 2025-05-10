/**
 * Background script for Page Resumer extension
 * Handles message passing between popup and content scripts
 */

// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set firstInstall to true when extension is first installed
    await chrome.storage.local.set({ firstInstall: true });
    console.log('Page Resumer extension installed, first install flag set');
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle message based on its type
  switch (message.action) {
    case 'extractPageContent':
      // Send message to content script to extract page content
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ success: false, error: 'No active tab found' });
          return;
        }
        
        chrome.tabs.sendMessage(tabs[0].id, { action: 'extractContent' }, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ 
              success: false, 
              error: 'Failed to extract content: ' + chrome.runtime.lastError.message 
            });
            return;
          }
          
          // Forward the response back to the popup
          sendResponse(response);
        });
      });
      break;
      
    case 'requestSummary':
      // Make API call to Gemini AI for summarization
      generateGeminiSummary(
        message.content, 
        message.apiKey, 
        message.language, 
        message.summaryOptions // Pass the summary options
      )
        .then(summary => {
          sendResponse({ success: true, summary });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      break;
      
    case 'answerQuestion':
      // Make API call to Gemini AI for question answering
      askGeminiQuestion(
        message.content, 
        message.question, 
        message.apiKey, 
        message.language,
        message.conversationHistory, // Pass conversation history for context
        message.styleInstruction // Pass style instruction
      )
        .then(answer => {
          sendResponse({ success: true, answer });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      break;
  }
  
  // Return true to indicate that the response will be sent asynchronously
  return true;
});

/**
 * Makes an API call to Gemini AI to summarize content
 * @param {string} content - The webpage content to summarize
 * @param {string} apiKey - The Gemini API key
 * @param {string} language - The preferred language for the response (en or id)
 * @param {Object} summaryOptions - Options for customizing the summary
 * @param {string} summaryOptions.length - The desired length of summary (short, medium, long)
 * @param {string} summaryOptions.type - The output format type (default, paragraphs, bullets)
 * @param {string} summaryOptions.style - The language style (standard, formal, simple, conversational)
 * @returns {Promise<string>} The summary text
 */
async function generateGeminiSummary(content, apiKey, language = 'en', summaryOptions = { length: 'medium', type: 'default', style: 'standard' }) {
  try {
    // Add a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const promptLanguage = language === 'id' ? 'in Bahasa Indonesia' : 'in English';
    
    // Define length parameters
    let lengthInstruction = '';
    switch (summaryOptions.length) {
      case 'short':
        lengthInstruction = 'Create a very brief and concise summary, maximum 3-4 sentences.';
        break;
      case 'medium':
        lengthInstruction = 'Create a moderate-length summary with the key points.';
        break;
      case 'long':
        lengthInstruction = 'Create a comprehensive and detailed summary that covers all important aspects.';
        break;
      default:
        lengthInstruction = 'Create a moderate-length summary with the key points.';
    }
    
    // Define type parameters (output format)
    let typeInstruction = '';
    switch (summaryOptions.type) {
      case 'default':
        typeInstruction = 'Use a mix of paragraphs and bullet points where appropriate.';
        break;
      case 'paragraphs':
        typeInstruction = 'Format the summary as paragraphs only, with clear topic sentences.';
        break;
      case 'bullets':
        typeInstruction = 'Format the summary as bullet points, with each point representing a key idea.';
        break;
      default:
        typeInstruction = 'Use a mix of paragraphs and bullet points where appropriate.';
    }
    
    // Define style parameters (language style)
    let styleInstruction = '';
    switch (summaryOptions.style) {
      case 'standard':
        styleInstruction = 'Use a standard, neutral writing style.';
        break;
      case 'formal':
        styleInstruction = 'Use a formal, academic writing style with sophisticated vocabulary.';
        break;
      case 'simple':
        styleInstruction = 'Use simple language that is easy to understand, avoiding complex terms.';
        break;
      case 'conversational':
        styleInstruction = 'Use a conversational tone as if explaining to a friend.';
        break;
      default:
        styleInstruction = 'Use a standard, neutral writing style.';
    }
    
    // Build the prompt with the custom instructions
    const prompt = `Summarize the following webpage content ${promptLanguage}. 
${lengthInstruction} 
${typeInstruction} 
${styleInstruction} 
Ensure the summary captures the main points and key information:\n\n${content}`;
    
    // Limit content length to avoid API limitations
    const truncatedContent = content.length > 25000 ? content.substring(0, 25000) + '...' : content;
    const truncatedPrompt = prompt.replace(content, truncatedContent);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: truncatedPrompt
          }]
        }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      
      if (response.status === 400) {
        throw new Error(`Bad request: Please check your API key or try again later. ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key in settings.');
      } else if (response.status === 403) {
        throw new Error('API access forbidden. Your API key might have insufficient permissions.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('Gemini AI service currently unavailable. Please try again later.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Invalid API response format');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating summary:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
}

/**
 * Makes an API call to Gemini AI to answer a question about content
 * @param {string} content - The webpage content
 * @param {string} question - The user's question
 * @param {string} apiKey - The Gemini API key
 * @param {string} language - The preferred language for the response (en or id)
 * @param {string} conversationHistory - Previous conversation history for context
 * @param {string} styleInstruction - Instruction for the response style
 * @returns {Promise<string>} The answer text
 */
async function askGeminiQuestion(content, question, apiKey, language = 'en', conversationHistory = '', styleInstruction = '') {
  try {
    // Add a timeout for the fetch operation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const promptLanguage = language === 'id' ? 'in Bahasa Indonesia' : 'in English';
    
    // Build the prompt with conversation history and style instruction
    let prompt = '';
    
    if (conversationHistory) {
      prompt = `This is a conversation about a webpage. Here's the previous conversation for context:\n\n${conversationHistory}\n\nNow the user has a new question. ${styleInstruction}\nBased on the following webpage content, please answer this question ${promptLanguage}:\n\nQuestion: ${question}\n\nWebpage content:\n${content}`;
    } else {
      prompt = `Based on the following webpage content, please answer this question ${promptLanguage}. ${styleInstruction}\n\nQuestion: ${question}\n\nWebpage content:\n${content}`;
    }
    
    // Limit content length to avoid API limitations
    const truncatedContent = content.length > 25000 ? content.substring(0, 25000) + '...' : content;
    const truncatedPrompt = prompt.replace(content, truncatedContent);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: truncatedPrompt
          }]
        }]
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      
      if (response.status === 400) {
        throw new Error(`Bad request: Please check your API key or try again later. ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key in settings.');
      } else if (response.status === 403) {
        throw new Error('API access forbidden. Your API key might have insufficient permissions.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('Gemini AI service currently unavailable. Please try again later.');
      } else {
        throw new Error(errorMessage);
      }
    }
    
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Invalid API response format');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error answering question:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    
    throw error;
  }
}