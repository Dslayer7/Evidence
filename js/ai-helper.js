/**
 * AI Helper for Evidence Documentation
 * This module provides functions to interact with the Groq AI API
 * for enhancing incident descriptions and formatting them properly
 * for professional workplace harassment documentation.
 */

// Configuration for Groq AI API
const GROQ_API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
let GROQ_API_KEY = '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'; // Pre-configured API key

/**
 * Set the Groq API key
 * @param {string} apiKey - The API key for Groq AI
 */
function setGroqApiKey(apiKey) {
    GROQ_API_KEY = apiKey;
    localStorage.setItem('groq_api_key', apiKey);
}

/**
 * Get the stored API key if available
 */
function getStoredApiKey() {
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) {
        GROQ_API_KEY = storedKey;
        return true;
    }
    return false;
}

/**
 * Check if the API key is set
 * @returns {boolean} - True if the API key is set, false otherwise
 */
function isApiKeySet() {
    return GROQ_API_KEY !== '';
}

/**
 * Prompt the user for their Groq API key if not already set
 * @returns {Promise<boolean>} - True if the API key was set, false otherwise
 */
async function promptForApiKey(language = 'en') {
    if (isApiKeySet()) return true;
    
    const promptMessage = language === 'en' 
        ? 'Please enter your Groq API key:'
        : 'Groq APIキーを入力してください：';
    
    const apiKey = prompt(promptMessage);
    if (apiKey && apiKey.trim() !== '') {
        setGroqApiKey(apiKey.trim());
        return true;
    }
    return false;
}

/**
 * Extract and structure incident information from raw user input
 * @param {string} rawInput - The raw user input containing incident details
 * @returns {Object} - Structured incident data
 */
function extractIncidentInfo(rawInput) {
    // Try to extract date in format YYYY-MM-DD or similar
    const dateRegex = /\b(20\d{2}[-/\.]\d{1,2}[-/\.]\d{1,2})\b/;
    const dateMatch = rawInput.match(dateRegex);
    
    // Try to extract time in format HH:MM or similar
    const timeRegex = /\b(\d{1,2}[:\.]\d{2}(?:\s*(?:AM|PM))?)\b/i;
    const timeMatch = rawInput.match(timeRegex);
    
    // Default values
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    const defaultTime = today.toTimeString().split(' ')[0].substring(0, 5);
    
    return {
        rawInput: rawInput,
        date: dateMatch ? normalizeDate(dateMatch[1]) : defaultDate,
        time: timeMatch ? normalizeTime(timeMatch[1]) : defaultTime
    };
}

/**
 * Normalize date string to YYYY-MM-DD format
 * @param {string} dateStr - Date string in various formats
 * @returns {string} - Normalized date string
 */
function normalizeDate(dateStr) {
    // Replace any separator with hyphen
    const normalized = dateStr.replace(/[/\.]/g, '-');
    const parts = normalized.split('-');
    
    // Ensure year, month, day are properly formatted
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Normalize time string to HH:MM format (24-hour)
 * @param {string} timeStr - Time string in various formats
 * @returns {string} - Normalized time string
 */
function normalizeTime(timeStr) {
    // Handle AM/PM format
    const isPM = /pm$/i.test(timeStr);
    const isAM = /am$/i.test(timeStr);
    
    // Remove AM/PM and trim
    let time = timeStr.replace(/\s*(?:AM|PM)$/i, '').trim();
    
    // Replace any separator with colon
    time = time.replace(/\./g, ':');
    
    // Split hours and minutes
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    
    // Convert to 24-hour format if needed
    if (isPM && hours < 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    }
    
    // Format properly
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Enhance incident content using Groq AI
 * @param {Object} incidentData - The incident data to enhance
 * @returns {Promise<Object>} - A promise that resolves to the enhanced incident data
 */
async function enhanceIncidentContent(incidentData) {
    if (!isApiKeySet()) {
        const keySet = await promptForApiKey();
        if (!keySet) {
            throw new Error('Groq API key is required to enhance incident content.');
        }
    }

    try {
        // Show processing indicator
        const aiProcessing = document.getElementById('ai-processing');
        if (aiProcessing) aiProcessing.classList.remove('hidden');
        
        // Create a prompt for the AI
        const prompt = createPrompt(incidentData);
        
        // Call the Groq API
        const response = await fetch(GROQ_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional lawyer with years of experience in workplace harassment cases. Your expertise is in documenting incidents in a clear, factual, and legally sound manner. Your task is to extract and enhance incident descriptions to be professional, objective, and appropriate for legal documentation. Focus on observable behaviors and their impact, avoiding emotional language while still conveying the severity of the situation. Format all content in a structured way that clearly identifies the harassing behavior and why it constitutes workplace harassment under Japanese labor laws.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        // Hide processing indicator
        if (aiProcessing) aiProcessing.classList.add('hidden');
        
        // Parse the AI response
        return parseAiResponse(data, incidentData);
    } catch (error) {
        console.error('Error enhancing incident content:', error);
        
        // Hide processing indicator
        const aiProcessing = document.getElementById('ai-processing');
        if (aiProcessing) aiProcessing.classList.add('hidden');
        
        throw error;
    }
}

/**
 * Process user responses to follow-up questions
 * @param {Object} incidentData - The current incident data
 * @param {Array} conversationHistory - The conversation history
 * @returns {Promise<Object>} - The updated incident data and follow-up questions
 */
async function processUserResponse(incidentData, conversationHistory) {
    if (!isApiKeySet()) {
        const keySet = await promptForApiKey();
        if (!keySet) {
            throw new Error('Groq API key is required to process user responses.');
        }
    }

    try {
        // Create a prompt for the AI
        const prompt = createFollowUpPrompt(incidentData, conversationHistory);
        
        // Call the Groq API
        const response = await fetch(GROQ_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional legal assistant specializing in workplace harassment documentation. Your task is to analyze user responses to follow-up questions and incorporate the new information into the incident documentation. Be thorough in identifying any remaining gaps in information that would be important for a complete legal record.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2, // Lower temperature for more precise responses
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        // Parse the AI response
        return parseFollowUpResponse(data);
    } catch (error) {
        console.error('Error processing user response:', error);
        throw error;
    }
}

/**
 * Parse the follow-up response from the AI
 * @param {Object} aiResponse - The response from the AI API
 * @returns {Object} - The parsed response with updated incident data and follow-up questions
 */
function parseFollowUpResponse(aiResponse) {
    try {
        const responseText = aiResponse.choices[0].message.content;
        const parsedData = JSON.parse(responseText);
        
        return {
            updatedIncident: parsedData.updatedIncident,
            followUpQuestions: parsedData.followUpQuestions || [],
            aiMessage: parsedData.aiMessage
        };
    } catch (error) {
        console.error('Error parsing follow-up response:', error);
        throw new Error('Failed to parse AI response for follow-up questions.');
    }
}

/**
 * Translate incident content to Japanese
 * @param {Object} incidentData - The incident data to translate
 * @returns {Promise<Object>} - A promise that resolves to the translated incident data
 */
async function translateToJapanese(incidentData) {
    if (!isApiKeySet()) {
        const keySet = await promptForApiKey();
        if (!keySet) {
            throw new Error('Groq API key is required to translate content.');
        }
    }

    try {
        // Create a prompt for the AI
        const prompt = createTranslationPrompt(incidentData);
        
        // Call the Groq API
        const response = await fetch(GROQ_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional translator specializing in legal and workplace documentation. Your task is to translate workplace harassment incident details from English to Japanese, maintaining the professional and legal tone. Ensure the translation is accurate, culturally appropriate, and preserves all important details.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2, // Lower temperature for more precise translation
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        
        // Parse the AI response
        return parseTranslationResponse(data, incidentData);
    } catch (error) {
        console.error('Error translating to Japanese:', error);
        throw error;
    }
}

/**
 * Create a prompt for the AI based on the incident data
 * @param {Object} incidentData - The incident data
 * @returns {string} - The prompt for the AI
 */
function createPrompt(incidentData) {
    // Following Groq's best practices for effective prompting:
    // 1. Start with clear instructions at the beginning
    // 2. Provide explicit format requirements
    // 3. Use structured, clear language
    
    return `TASK: Analyze and enhance the following workplace harassment incident description to create a professional, factual, and legally sound document.

REQUIRED OUTPUT FORMAT: Respond with a JSON object containing the following fields:
- title: A clear, professional title for the incident
- category: The most appropriate category (from: Physical Attack, Psychological Abuse, Excessive Work Demands, Isolation, Personal Intrusion, Verbal Abuse)
- description: An enhanced, objective description focusing on observable behaviors
- missingInfo: A list of any important missing information
- suggestedEvidenceTypes: Relevant evidence types (from: image, document, audio, video)

INCIDENT DETAILS:
Date: ${incidentData.date}
Time: ${incidentData.time}
Raw Description: ${incidentData.rawInput || incidentData.description}

GUIDELINES:
1. Be objective and factual, avoiding emotional language
2. Include all relevant details from the original description
3. Structure the description chronologically
4. Identify specific behaviors that constitute workplace harassment
5. Note any missing information that would strengthen the documentation

EXAMPLE OUTPUT FORMAT:
{
  "title": { "en": "Professional title here" },
  "category": { "en": "Selected category here" },
  "description": { "en": "Enhanced description here" },
  "missingInfo": ["List of missing information items"],
  "suggestedEvidenceTypes": ["List of suggested evidence types"]
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Create a prompt for the AI to process user responses to follow-up questions
 * @param {Object} incidentData - The current incident data
 * @param {Array} conversationHistory - The conversation history
 * @returns {string} - The prompt for the AI
 */
function createFollowUpPrompt(incidentData, conversationHistory) {
    // Extract the last few messages for context (up to 5)
    const recentMessages = conversationHistory.slice(-5);
    const conversationText = recentMessages
        .map(msg => `${msg.role === 'assistant' ? 'AI' : 'User'}: ${msg.content}`)
        .join('\n\n');
    
    return `TASK: Analyze the user's responses to follow-up questions about a workplace harassment incident and update the incident documentation accordingly.

CURRENT INCIDENT INFORMATION:
Date: ${incidentData.date}
Time: ${incidentData.time}
Title: ${incidentData.title?.en || 'Not specified'}
Category: ${incidentData.category?.en || 'Not specified'}
Description: ${incidentData.description?.en || incidentData.description || 'Not specified'}
Missing Information: ${incidentData.missingInfo ? JSON.stringify(incidentData.missingInfo) : 'None identified'}
Suggested Evidence Types: ${incidentData.suggestedEvidenceTypes ? JSON.stringify(incidentData.suggestedEvidenceTypes) : 'None suggested'}

RECENT CONVERSATION:
${conversationText}

INSTRUCTIONS:
1. Analyze the user's responses and extract any new information
2. Update the incident details with this new information
3. Identify any remaining important information that is still missing
4. Provide a clear message acknowledging the user's response

REQUIRED OUTPUT FORMAT:
{
  "updatedIncident": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "title": { "en": "Updated title" },
    "category": { "en": "Updated category" },
    "description": { "en": "Updated description incorporating new information" },
    "missingInfo": ["Any remaining missing information items"],
    "suggestedEvidenceTypes": ["Updated list of suggested evidence types"]
  },
  "followUpQuestions": ["List of specific follow-up questions if any information is still missing"],
  "aiMessage": "Message acknowledging user's response and explaining what was updated"
}

If there are no more follow-up questions needed, include an empty array for followUpQuestions.
Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Create a translation prompt for the AI
 * @param {Object} incidentData - The incident data to translate
 * @returns {string} - The prompt for the AI
 */
function createTranslationPrompt(incidentData) {
    return `TASK: Translate the following workplace harassment incident details from English to Japanese.

CONTENT TO TRANSLATE:
Title: ${incidentData.title?.en || 'Not specified'}
Category: ${incidentData.category?.en || 'Not specified'}
Description: ${incidentData.description?.en || incidentData.description || 'Not specified'}

INSTRUCTIONS:
1. Maintain the professional and legal tone in the Japanese translation
2. Ensure the translation is culturally appropriate for a Japanese workplace context
3. Preserve all important details and the structure of the original text
4. Use appropriate Japanese legal terminology for workplace harassment

REQUIRED OUTPUT FORMAT:
{
  "title": { "ja": "Japanese title here" },
  "category": { "ja": "Japanese category here" },
  "description": { "ja": "Japanese description here" }
}

Respond ONLY with the JSON object, no additional text.`;
}

/**
 * Parse the AI response and extract the enhanced incident data
 * @param {Object} aiResponse - The response from the AI API
 * @param {Object} originalData - The original incident data
 * @returns {Object} - The enhanced incident data
 */
function parseAiResponse(aiResponse, originalData) {
    try {
        const responseText = aiResponse.choices[0].message.content;
        let enhancedData;
        
        try {
            // Try to parse as JSON directly
            enhancedData = JSON.parse(responseText);
        } catch (jsonError) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                enhancedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not extract JSON from AI response');
            }
        }
        
        // Combine with original data
        return {
            date: originalData.date,
            time: originalData.time,
            title: enhancedData.title || { en: '' },
            category: enhancedData.category || { en: 'Verbal Abuse' },
            description: enhancedData.description || { en: originalData.rawInput || originalData.description },
            missingInfo: enhancedData.missingInfo || [],
            suggestedEvidenceTypes: enhancedData.suggestedEvidenceTypes || []
        };
    } catch (error) {
        console.error('Error parsing AI response:', error);
        throw new Error('Failed to parse AI response for incident enhancement.');
    }
}

/**
 * Parse the translation response
 * @param {Object} aiResponse - The response from the AI API
 * @param {Object} originalData - The original incident data
 * @returns {Object} - The fully translated incident data
 */
function parseTranslationResponse(aiResponse, originalData) {
    try {
        const responseText = aiResponse.choices[0].message.content;
        let translatedData;
        
        try {
            // Try to parse as JSON directly
            translatedData = JSON.parse(responseText);
        } catch (jsonError) {
            // If direct parsing fails, try to extract JSON from the text
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                translatedData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Could not extract JSON from AI response');
            }
        }
        
        // Combine with original data
        return {
            date: originalData.date,
            time: originalData.time,
            title: {
                en: originalData.title?.en || '',
                ja: translatedData.title?.ja || ''
            },
            category: {
                en: originalData.category?.en || 'Verbal Abuse',
                ja: translatedData.category?.ja || '言葉による虐待'
            },
            description: {
                en: originalData.description?.en || originalData.description || '',
                ja: translatedData.description?.ja || ''
            }
        };
    } catch (error) {
        console.error('Error parsing translation response:', error);
        throw new Error('Failed to parse AI response for translation.');
    }
}

/**
 * Generate a suggested filename for evidence based on incident details
 * @param {Object} incidentData - The incident data
 * @param {string} originalFilename - The original filename
 * @param {string} evidenceType - The type of evidence
 * @returns {string} - A suggested filename
 */
function suggestEvidenceFilename(incidentData, originalFilename, evidenceType) {
    // Extract date in YYYYMMDD format
    const dateStr = incidentData.date.replace(/-/g, '');
    
    // Extract a short version of the title (first 3 words)
    const title = incidentData.title?.en || 'incident';
    const shortTitle = title
        .split(' ')
        .slice(0, 3)
        .join('_')
        .replace(/[^\w\s]/gi, '')
        .toLowerCase();
    
    // Get file extension from original filename
    let fileExt = 'txt';
    if (originalFilename) {
        const extMatch = originalFilename.match(/\.([^.]+)$/);
        if (extMatch) {
            fileExt = extMatch[1];
        }
    } else {
        // Default extensions based on evidence type
        switch (evidenceType) {
            case 'image': fileExt = 'jpg'; break;
            case 'document': fileExt = 'pdf'; break;
            case 'audio': fileExt = 'mp3'; break;
            case 'video': fileExt = 'mp4'; break;
        }
    }
    
    // Create a suggested filename
    return `${dateStr}_${shortTitle}_${evidenceType}.${fileExt}`;
}

/**
 * Generate a unique ID for a new incident
 * @returns {string} - A unique ID
 */
function generateId() {
    return 'inc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Initialize by trying to get stored API key
document.addEventListener('DOMContentLoaded', () => {
    getStoredApiKey();
});

// Export the public API
window.AiHelper = {
    setGroqApiKey,
    getStoredApiKey,
    isApiKeySet,
    promptForApiKey,
    extractIncidentInfo,
    enhanceIncidentContent,
    processUserResponse,
    translateToJapanese,
    suggestEvidenceFilename,
    generateId
};
