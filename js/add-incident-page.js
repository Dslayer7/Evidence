/**
 * Add Incident Page Script
 * Handles all functionality related to adding new incidents with AI enhancement
 */

// Global variables
let currentLanguage = 'en';
let enhancedIncidentData = null;
let translatedIncidentData = null;
let rawInputText = '';
let conversationHistory = [];
let waitingForUserResponse = false;

// Initialize the page
function init() {
    // Set default language based on browser
    const browserLang = navigator.language.split('-')[0];
    currentLanguage = browserLang === 'ja' ? 'ja' : 'en';
    
    // Initialize the form
    initAddIncidentForm();
    
    // Set up language toggle
    setupLanguageToggle();
    
    // Update UI with current language
    updateLanguage();
}

/**
 * Initialize the add incident form and set up event listeners
 */
function initAddIncidentForm() {
    // Populate category dropdown
    populateCategoryDropdown();
    
    // Set up evidence add button
    const addEvidenceBtn = document.querySelector('.add-evidence-btn');
    if (addEvidenceBtn) {
        addEvidenceBtn.addEventListener('click', addEvidenceRow);
    }
    
    // Set up form submission
    const addIncidentForm = document.getElementById('add-incident-form');
    if (addIncidentForm) {
        addIncidentForm.addEventListener('submit', handleFormSubmission);
    }
    
    // Set up AI enhance button
    const aiEnhanceBtn = document.getElementById('ai-enhance-btn');
    if (aiEnhanceBtn) {
        aiEnhanceBtn.addEventListener('click', handleAiEnhance);
    }
    
    // Set up accept and reject AI buttons
    const acceptAiBtn = document.getElementById('accept-ai-btn');
    if (acceptAiBtn) {
        acceptAiBtn.addEventListener('click', acceptAiEnhancement);
    }
    
    const rejectAiBtn = document.getElementById('reject-ai-btn');
    if (rejectAiBtn) {
        rejectAiBtn.addEventListener('click', rejectAiEnhancement);
    }
    
    // Set up send response button for AI conversation
    const sendResponseBtn = document.getElementById('send-response-btn');
    if (sendResponseBtn) {
        sendResponseBtn.addEventListener('click', sendUserResponse);
    }
    
    // Set up enter key for sending responses
    const userResponseInput = document.getElementById('user-response');
    if (userResponseInput) {
        userResponseInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserResponse();
            }
        });
    }
    
    // Set today's date as default
    const incidentDateInput = document.getElementById('incident-date');
    if (incidentDateInput) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        incidentDateInput.value = formattedDate;
    }
    
    // Set current time as default
    const incidentTimeInput = document.getElementById('incident-time');
    if (incidentTimeInput) {
        const today = new Date();
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        incidentTimeInput.value = `${hours}:${minutes}`;
    }
    
    // Add focus event to description field to capture raw input
    const descriptionField = document.getElementById('incident-description');
    if (descriptionField) {
        descriptionField.addEventListener('input', function() {
            rawInputText = this.value;
        });
    }
    
    // Check if Groq API key is stored in localStorage
    if (window.AiHelper && typeof window.AiHelper.getStoredApiKey === 'function') {
        window.AiHelper.getStoredApiKey();
    }
}

/**
 * Set up language toggle buttons
 */
function setupLanguageToggle() {
    const langEn = document.getElementById('lang-en');
    const langJa = document.getElementById('lang-ja');
    
    if (langEn && langJa) {
        langEn.addEventListener('click', function() {
            currentLanguage = 'en';
            langEn.classList.add('active');
            langJa.classList.remove('active');
            updateLanguage();
        });
        
        langJa.addEventListener('click', function() {
            currentLanguage = 'ja';
            langJa.classList.add('active');
            langEn.classList.remove('active');
            updateLanguage();
        });
    }
}

/**
 * Update UI with current language
 */
function updateLanguage() {
    // Update navigation text
    document.querySelector('#calendar-nav .nav-text').textContent = translations[currentLanguage].calendar || 'Calendar View';
    document.querySelector('#timeline-nav .nav-text').textContent = translations[currentLanguage].timeline || 'Timeline View';
    document.querySelector('#add-incident-nav .nav-text').textContent = translations[currentLanguage].addIncident || 'Add Incident';
    
    // Update form labels
    document.getElementById('add-incident-heading').textContent = translations[currentLanguage].addNewIncident || 'Add New Incident';
    document.getElementById('incident-date-label').textContent = translations[currentLanguage].date || 'Date:';
    document.getElementById('incident-time-label').textContent = translations[currentLanguage].time || 'Time:';
    document.getElementById('incident-title-en-label').textContent = translations[currentLanguage].titleEn || 'Title (English):';
    document.getElementById('incident-title-ja-label').textContent = translations[currentLanguage].titleJa || 'Title (Japanese):';
    document.getElementById('incident-category-label').textContent = translations[currentLanguage].category || 'Category:';
    document.getElementById('incident-description-label').textContent = translations[currentLanguage].description || 'Description:';
    document.getElementById('incident-evidence-label').textContent = translations[currentLanguage].evidenceFiles || 'Evidence Files:';
    
    // Update AI conversation section
    if (document.getElementById('ai-conversation-label')) {
        document.getElementById('ai-conversation-label').textContent = translations[currentLanguage].aiFollowUpQuestions || 'AI Follow-up Questions:';
    }
    
    if (document.getElementById('user-response')) {
        document.getElementById('user-response').placeholder = translations[currentLanguage].typeYourResponse || 'Type your response here...';
    }
    
    // Update buttons
    document.getElementById('ai-enhance-btn').textContent = translations[currentLanguage].enhanceWithAi || 'Enhance with AI';
    document.getElementById('save-incident-btn').textContent = translations[currentLanguage].saveIncident || 'Save Incident';
    
    if (document.getElementById('ai-processing-text')) {
        document.getElementById('ai-processing-text').textContent = translations[currentLanguage].processingWithAi || 'Processing with AI...';
    }
    
    if (document.getElementById('ai-preview-heading')) {
        document.getElementById('ai-preview-heading').textContent = translations[currentLanguage].aiEnhancedContent || 'AI Enhanced Content';
    }
    
    if (document.getElementById('accept-ai-btn')) {
        document.getElementById('accept-ai-btn').textContent = translations[currentLanguage].accept || 'Accept';
    }
    
    if (document.getElementById('reject-ai-btn')) {
        document.getElementById('reject-ai-btn').textContent = translations[currentLanguage].reject || 'Reject';
    }
    
    // Update evidence input placeholders
    const evidenceFilenameInputs = document.querySelectorAll('.evidence-filename');
    evidenceFilenameInputs.forEach(input => {
        input.placeholder = translations[currentLanguage].filename || 'Filename';
    });
    
    const evidenceDescriptionInputs = document.querySelectorAll('.evidence-description');
    evidenceDescriptionInputs.forEach(input => {
        input.placeholder = translations[currentLanguage].evidenceDescription || 'Description';
    });
    
    // Update category dropdown
    populateCategoryDropdown();
}

/**
 * Populate category dropdown with options from translations
 */
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('incident-category');
    if (!categorySelect) return;
    
    categorySelect.innerHTML = '';
    
    // Get categories from translations
    const categories = [
        { value: 'physicalAttack', label: translations[currentLanguage].physicalAttack },
        { value: 'psychologicalAbuse', label: translations[currentLanguage].psychologicalAbuse },
        { value: 'excessiveWorkDemands', label: translations[currentLanguage].excessiveWorkDemands },
        { value: 'isolation', label: translations[currentLanguage].isolation },
        { value: 'personalIntrusion', label: translations[currentLanguage].personalIntrusion },
        { value: 'verbalAbuse', label: translations[currentLanguage].verbalAbuse }
    ];
    
    // Add options to select
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = category.label;
        categorySelect.appendChild(option);
    });
}

/**
 * Add a new evidence row to the form
 */
function addEvidenceRow() {
    const evidenceContainer = document.querySelector('.evidence-input-container');
    if (!evidenceContainer) return;
    
    const newRow = document.createElement('div');
    newRow.className = 'evidence-input-row';
    
    newRow.innerHTML = `
        <select class="evidence-type">
            <option value="image">${translations[currentLanguage].image || 'Image'}</option>
            <option value="document">${translations[currentLanguage].document || 'Document'}</option>
            <option value="audio">${translations[currentLanguage].audio || 'Audio'}</option>
            <option value="video">${translations[currentLanguage].video || 'Video'}</option>
        </select>
        <input type="text" class="evidence-filename" placeholder="${translations[currentLanguage].filename || 'Filename'}">
        <input type="text" class="evidence-description" placeholder="${translations[currentLanguage].evidenceDescription || 'Description'}">
        <button type="button" class="remove-evidence-btn"><i class="fas fa-minus"></i></button>
    `;
    
    evidenceContainer.appendChild(newRow);
    
    // Add event listener to remove button
    const removeBtn = newRow.querySelector('.remove-evidence-btn');
    removeBtn.addEventListener('click', () => {
        evidenceContainer.removeChild(newRow);
    });
}

/**
 * Handle form submission
 * @param {Event} e - The form submission event
 */
function handleFormSubmission(e) {
    e.preventDefault();
    
    // Get form data
    const date = document.getElementById('incident-date')?.value;
    const time = document.getElementById('incident-time')?.value;
    const titleEn = document.getElementById('incident-title-en')?.value;
    const titleJa = document.getElementById('incident-title-ja')?.value;
    const categoryValue = document.getElementById('incident-category')?.value;
    const description = document.getElementById('incident-description')?.value;
    
    // Validate required fields
    if (!date || !time || !titleEn || !titleJa || !categoryValue || !description) {
        alert(translations[currentLanguage].fillAllFields || 'Please fill all required fields');
        return;
    }
    
    // Get category labels
    const categoryEn = translations.en[categoryValue];
    const categoryJa = translations.ja[categoryValue];
    
    // Get evidence data
    const evidenceRows = document.querySelectorAll('.evidence-input-row');
    const evidence = Array.from(evidenceRows).map(row => {
        const type = row.querySelector('.evidence-type')?.value;
        const filename = row.querySelector('.evidence-filename')?.value;
        const description = row.querySelector('.evidence-description')?.value;
        
        if (!filename) return null;
        
        return {
            type,
            url: `evidence/${type}s/${filename}`,
            description: {
                en: description,
                ja: description // We'll use the same description for both languages initially
            }
        };
    }).filter(item => item !== null);
    
    // Create new incident
    const newIncident = {
        id: generateIncidentId(),
        date,
        time,
        title: {
            en: titleEn,
            ja: titleJa
        },
        category: {
            en: categoryEn,
            ja: categoryJa
        },
        description: {
            en: description,
            ja: description // We'll use the same description for both languages initially
        },
        evidence
    };
    
    // If we have enhanced data from AI, use that instead
    if (enhancedIncidentData) {
        newIncident.title.en = enhancedIncidentData.title.en;
        newIncident.category.en = enhancedIncidentData.category.en;
        newIncident.description.en = enhancedIncidentData.description.en;
    }
    
    // If we have translated data from AI, use that for Japanese
    if (translatedIncidentData) {
        newIncident.title.ja = translatedIncidentData.title.ja;
        newIncident.category.ja = translatedIncidentData.category.ja;
        newIncident.description.ja = translatedIncidentData.description.ja;
        
        // Update evidence descriptions if available
        if (translatedIncidentData.evidence) {
            newIncident.evidence = newIncident.evidence.map((item, index) => {
                if (translatedIncidentData.evidence[index] && translatedIncidentData.evidence[index].description) {
                    item.description.ja = translatedIncidentData.evidence[index].description.ja;
                }
                return item;
            });
        }
    }
    
    // Add the new incident to the incidents array
    saveIncident(newIncident);
}

/**
 * Generate a unique ID for a new incident
 * @returns {string} - A unique ID in the format inc001, inc002, etc.
 */
function generateIncidentId() {
    // In a real application, this would be generated on the server
    // For now, we'll use a timestamp-based ID
    return `inc${Date.now().toString().slice(-6)}`;
}

/**
 * Save incident to JSON file
 * In a real application, this would send the data to a server
 * @param {Object} newIncident - The new incident to save
 */
function saveIncident(newIncident) {
    // In a real application, this would be an API call
    // For now, we'll just simulate saving and redirect
    
    // Show success message
    alert(translations[currentLanguage].incidentAdded || 'Incident added successfully!');
    
    // Redirect to the main page
    window.location.href = 'index.html';
}

/**
 * Handle AI enhancement
 */
function handleAiEnhance() {
    // Get form data
    const date = document.getElementById('incident-date')?.value;
    const time = document.getElementById('incident-time')?.value;
    const description = document.getElementById('incident-description')?.value || rawInputText;
    
    // Validate required fields
    if (!description) {
        alert(translations[currentLanguage].fillDescription || 'Please fill in at least the description field');
        return;
    }
    
    // Reset conversation history
    conversationHistory = [];
    
    // Show processing indicator
    document.getElementById('ai-processing').classList.remove('hidden');
    document.getElementById('ai-preview').classList.add('hidden');
    
    // Hide conversation section initially
    document.getElementById('ai-conversation-section').classList.add('hidden');
    
    // Call AI helper to enhance the incident
    if (window.AiHelper && typeof window.AiHelper.enhanceIncidentContent === 'function') {
        // Extract incident info from raw input
        const incidentInfo = window.AiHelper.extractIncidentInfo(description);
        
        // Use provided date/time if available, otherwise use extracted or default values
        incidentInfo.date = date || incidentInfo.date;
        incidentInfo.time = time || incidentInfo.time;
        
        window.AiHelper.enhanceIncidentContent(incidentInfo)
            .then(enhancedData => {
                // Store enhanced data
                enhancedIncidentData = enhancedData;
                
                // Update date and time fields with extracted values
                document.getElementById('incident-date').value = enhancedData.date;
                document.getElementById('incident-time').value = enhancedData.time;
                
                // Check if AI has follow-up questions
                if (enhancedData.missingInfo && enhancedData.missingInfo.length > 0) {
                    // Show conversation section
                    document.getElementById('ai-processing').classList.add('hidden');
                    document.getElementById('ai-conversation-section').classList.remove('hidden');
                    
                    // Add AI message with questions
                    const questions = enhancedData.missingInfo.map(item => `- ${item}`).join('\n');
                    const aiMessage = `I need some additional information to enhance your incident report:\n${questions}`;
                    addMessageToConversation('ai', aiMessage);
                    
                    // Set waiting for user response
                    waitingForUserResponse = true;
                    
                    // Focus on response input
                    document.getElementById('user-response').focus();
                } else {
                    // No questions, proceed with translation
                    return window.AiHelper.translateToJapanese(enhancedData)
                        .then(translatedData => {
                            finishEnhancement(translatedData);
                        });
                }
            })
            .catch(error => {
                console.error('AI enhancement error:', error);
                document.getElementById('ai-processing').classList.add('hidden');
                alert(translations[currentLanguage].aiEnhancementError || 'Error during AI enhancement. Please try again.');
            });
    } else {
        document.getElementById('ai-processing').classList.add('hidden');
        alert(translations[currentLanguage].aiHelperNotAvailable || 'AI helper is not available. Please check your configuration.');
    }
}

/**
 * Add a message to the conversation container
 * @param {string} sender - 'ai' or 'user'
 * @param {string} text - The message text
 */
function addMessageToConversation(sender, text) {
    const conversationContainer = document.getElementById('conversation-container');
    if (!conversationContainer) return;
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    
    // Format text with line breaks
    const formattedText = text.replace(/\n/g, '<br>');
    
    // Add timestamp
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Set message content
    messageEl.innerHTML = `
        <div class="message-content">${formattedText}</div>
        <div class="message-timestamp">${timeString}</div>
    `;
    
    // Add to conversation container
    conversationContainer.appendChild(messageEl);
    
    // Scroll to bottom
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
    
    // Add to conversation history
    conversationHistory.push({
        role: sender === 'ai' ? 'assistant' : 'user',
        content: text
    });
}

/**
 * Send user response to AI
 */
function sendUserResponse() {
    if (!waitingForUserResponse) return;
    
    const userResponseInput = document.getElementById('user-response');
    if (!userResponseInput) return;
    
    const userResponse = userResponseInput.value.trim();
    if (!userResponse) return;
    
    // Add user message to conversation
    addMessageToConversation('user', userResponse);
    
    // Clear input
    userResponseInput.value = '';
    
    // Show processing indicator
    document.getElementById('ai-processing').classList.remove('hidden');
    
    // Set not waiting for response while processing
    waitingForUserResponse = false;
    
    // Process user response
    if (window.AiHelper && typeof window.AiHelper.processUserResponse === 'function') {
        window.AiHelper.processUserResponse(enhancedIncidentData, conversationHistory)
            .then(result => {
                // Hide processing indicator
                document.getElementById('ai-processing').classList.add('hidden');
                
                // Update enhanced data with new information
                enhancedIncidentData = result.updatedIncident;
                
                if (result.followUpQuestions && result.followUpQuestions.length > 0) {
                    // AI has more questions
                    const questions = result.followUpQuestions.map(item => `- ${item}`).join('\n');
                    const aiMessage = result.aiMessage || `Thank you. I have a few more questions:\n${questions}`;
                    
                    addMessageToConversation('ai', aiMessage);
                    waitingForUserResponse = true;
                } else {
                    // No more questions, proceed with translation
                    addMessageToConversation('ai', result.aiMessage || 'Thank you for providing the additional information. I will now enhance your incident report.');
                    
                    // Proceed with translation
                    window.AiHelper.translateToJapanese(enhancedIncidentData)
                        .then(translatedData => {
                            finishEnhancement(translatedData);
                        });
                }
            })
            .catch(error => {
                console.error('AI processing error:', error);
                document.getElementById('ai-processing').classList.add('hidden');
                
                // Add error message to conversation
                addMessageToConversation('ai', 'I apologize, but I encountered an error processing your response. Let me try to enhance your incident report with the information I have.');
                
                // Proceed with translation despite error
                window.AiHelper.translateToJapanese(enhancedIncidentData)
                    .then(translatedData => {
                        finishEnhancement(translatedData);
                    });
            });
    } else {
        document.getElementById('ai-processing').classList.add('hidden');
        
        // Add fallback message
        addMessageToConversation('ai', 'Thank you for your response. I will now enhance your incident report.');
        
        // Proceed with translation
        window.AiHelper.translateToJapanese(enhancedIncidentData)
            .then(translatedData => {
                finishEnhancement(translatedData);
            });
    }
}

/**
 * Finish the enhancement process after all Q&A and translation
 * @param {Object} translatedData - The translated incident data
 */
function finishEnhancement(translatedData) {
    // Hide processing indicator
    document.getElementById('ai-processing').classList.add('hidden');
    
    // Store translated data
    translatedIncidentData = translatedData;
    
    // Show preview
    const previewContent = document.getElementById('ai-preview-content');
    previewContent.innerHTML = `
        <div class="enhanced-title">
            <h4>Enhanced Title:</h4>
            <p><strong>English:</strong> ${enhancedIncidentData.title.en}</p>
            <p><strong>Japanese:</strong> ${translatedData.title.ja}</p>
        </div>
        <div class="enhanced-category">
            <h4>Category:</h4>
            <p><strong>English:</strong> ${enhancedIncidentData.category.en}</p>
            <p><strong>Japanese:</strong> ${translatedData.category.ja}</p>
        </div>
        <div class="enhanced-description">
            <h4>Enhanced Description:</h4>
            <p><strong>English:</strong> ${enhancedIncidentData.description.en}</p>
            <p><strong>Japanese:</strong> ${translatedData.description.ja}</p>
        </div>
    `;
    
    document.getElementById('ai-preview').classList.remove('hidden');
}

/**
 * Accept AI enhancement
 */
function acceptAiEnhancement() {
    if (!enhancedIncidentData) return;
    
    // Update form fields with enhanced data
    document.getElementById('incident-title-en').value = enhancedIncidentData.title.en;
    document.getElementById('incident-category').value = getCategoryValueByLabel(enhancedIncidentData.category.en);
    document.getElementById('incident-description').value = enhancedIncidentData.description.en;
    
    // If we have translated data, update Japanese fields
    if (translatedIncidentData) {
        document.getElementById('incident-title-ja').value = translatedIncidentData.title.ja;
    }
    
    // Suggest evidence types based on AI recommendation
    if (enhancedIncidentData.suggestedEvidenceTypes && enhancedIncidentData.suggestedEvidenceTypes.length > 0) {
        const evidenceContainer = document.querySelector('.evidence-input-container');
        if (evidenceContainer && evidenceContainer.children.length === 1) {
            // If we only have the default row, update it with the first suggested type
            const firstRow = evidenceContainer.querySelector('.evidence-input-row');
            const typeSelect = firstRow.querySelector('.evidence-type');
            if (typeSelect) {
                typeSelect.value = enhancedIncidentData.suggestedEvidenceTypes[0];
            }
            
            // Add additional rows for other suggested types
            for (let i = 1; i < enhancedIncidentData.suggestedEvidenceTypes.length; i++) {
                addEvidenceRow();
                const newRow = evidenceContainer.lastChild;
                const typeSelect = newRow.querySelector('.evidence-type');
                if (typeSelect) {
                    typeSelect.value = enhancedIncidentData.suggestedEvidenceTypes[i];
                }
            }
        }
    }
    
    // Hide preview and conversation
    document.getElementById('ai-preview').classList.add('hidden');
    document.getElementById('ai-conversation-section').classList.add('hidden');
    
    // Show success message
    alert(translations[currentLanguage].aiEnhancementApplied || 'AI enhancement applied successfully!');
}

/**
 * Get category value by its label
 * @param {string} label - The category label
 * @returns {string} - The category value
 */
function getCategoryValueByLabel(label) {
    // Map of English category labels to their values
    const categoryMap = {
        'Physical Attack': 'physicalAttack',
        'Psychological Abuse': 'psychologicalAbuse',
        'Excessive Work Demands': 'excessiveWorkDemands',
        'Isolation': 'isolation',
        'Personal Intrusion': 'personalIntrusion',
        'Verbal Abuse': 'verbalAbuse'
    };
    
    return categoryMap[label] || 'verbalAbuse'; // Default to verbal abuse if not found
}

/**
 * Reject AI enhancement
 */
function rejectAiEnhancement() {
    // Clear enhanced data
    enhancedIncidentData = null;
    translatedIncidentData = null;
    
    // Hide preview and conversation
    document.getElementById('ai-preview').classList.add('hidden');
    document.getElementById('ai-conversation-section').classList.add('hidden');
    
    // Show message
    alert(translations[currentLanguage].aiEnhancementRejected || 'AI enhancement rejected.');
}

/**
 * Suggest filenames for evidence based on incident details
 */
function suggestEvidenceFilenames() {
    if (!enhancedIncidentData) return;
    
    const evidenceRows = document.querySelectorAll('.evidence-input-row');
    evidenceRows.forEach(row => {
        const filenameInput = row.querySelector('.evidence-filename');
        const typeSelect = row.querySelector('.evidence-type');
        
        if (filenameInput && filenameInput.value && typeSelect && window.AiHelper) {
            const originalFilename = filenameInput.value;
            const evidenceType = typeSelect.value;
            
            const suggestedFilename = window.AiHelper.suggestEvidenceFilename(
                enhancedIncidentData,
                originalFilename,
                evidenceType
            );
            
            filenameInput.value = suggestedFilename;
        }
    });
}

// Initialize the page when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
