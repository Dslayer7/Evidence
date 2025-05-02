/**
 * Add Incident Module
 * Handles all functionality related to adding new incidents with AI enhancement
 */

// Global variable to store enhanced incident data from AI
let enhancedIncidentData = null;

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
    
    // Check if Groq API key is stored in localStorage
    const storedApiKey = localStorage.getItem('groqApiKey');
    if (storedApiKey && window.AiHelper) {
        window.AiHelper.setGroqApiKey(storedApiKey);
    } else if (aiEnhanceBtn) {
        // Prompt for API key on first use of AI enhance
        aiEnhanceBtn.addEventListener('click', promptForApiKey, { once: true });
    }
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
            <option value="image">${translations[currentLanguage].image}</option>
            <option value="document">${translations[currentLanguage].document}</option>
            <option value="audio">${translations[currentLanguage].audio}</option>
            <option value="video">${translations[currentLanguage].video}</option>
        </select>
        <input type="text" class="evidence-filename" placeholder="${translations[currentLanguage].filename}">
        <input type="text" class="evidence-description" placeholder="${translations[currentLanguage].evidenceDescription}">
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
        newIncident.title = enhancedIncidentData.title;
        newIncident.description = enhancedIncidentData.description;
        if (enhancedIncidentData.evidence) {
            newIncident.evidence = enhancedIncidentData.evidence;
        }
        enhancedIncidentData = null;
    }
    
    // Add to incidents array
    window.incidents.push(newIncident);
    window.filteredIncidents = [...window.incidents];
    
    // Save to incidents.json
    saveIncidents();
    
    // Reset form
    document.getElementById('add-incident-form').reset();
    const evidenceContainer = document.querySelector('.evidence-input-container');
    if (evidenceContainer) {
        evidenceContainer.innerHTML = `
            <div class="evidence-input-row">
                <select class="evidence-type">
                    <option value="image">${translations[currentLanguage].image}</option>
                    <option value="document">${translations[currentLanguage].document}</option>
                    <option value="audio">${translations[currentLanguage].audio}</option>
                    <option value="video">${translations[currentLanguage].video}</option>
                </select>
                <input type="text" class="evidence-filename" placeholder="${translations[currentLanguage].filename}">
                <input type="text" class="evidence-description" placeholder="${translations[currentLanguage].evidenceDescription}">
                <button type="button" class="add-evidence-btn"><i class="fas fa-plus"></i></button>
            </div>
        `;
        
        // Set up evidence add button again
        const addEvidenceBtn = evidenceContainer.querySelector('.add-evidence-btn');
        if (addEvidenceBtn) {
            addEvidenceBtn.addEventListener('click', addEvidenceRow);
        }
    }
    
    // Hide AI preview
    const aiPreview = document.getElementById('ai-preview');
    if (aiPreview) {
        aiPreview.classList.add('hidden');
    }
    
    // Show success message
    alert(translations[currentLanguage].incidentAdded);
    
    // Update views
    if (window.currentView === 'calendar') {
        window.updateCalendar();
        window.updateCalendarIncidents();
    } else if (window.currentView === 'timeline') {
        window.updateTimelineView();
    }
}

/**
 * Generate a unique ID for a new incident
 * @returns {string} - A unique ID in the format inc001, inc002, etc.
 */
function generateIncidentId() {
    // Find the highest existing ID number
    const idNumbers = window.incidents.map(incident => {
        const match = incident.id?.match(/inc(\d+)/);
        return match ? parseInt(match[1]) : 0;
    });
    
    const maxId = Math.max(0, ...idNumbers);
    const newIdNumber = maxId + 1;
    
    // Format as inc001, inc002, etc.
    return `inc${String(newIdNumber).padStart(3, '0')}`;
}

/**
 * Save incidents to JSON file
 * In a real application, this would send the data to a server
 */
function saveIncidents() {
    console.log('Saving incidents:', { incidents: window.incidents });
    
    // In a real application with a backend, you would use fetch to send the data:
    /*
    fetch('/api/incidents', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ incidents: window.incidents })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
    */
}

/**
 * Prompt for Groq API key
 */
function promptForApiKey() {
    const apiKey = prompt(translations[currentLanguage].enterApiKey);
    if (apiKey && window.AiHelper) {
        window.AiHelper.setGroqApiKey(apiKey);
        localStorage.setItem('groqApiKey', apiKey);
    }
}

/**
 * Handle AI enhancement
 */
async function handleAiEnhance() {
    if (!window.AiHelper) {
        console.error('AiHelper not available');
        return;
    }
    
    // Check if API key is set
    if (!window.AiHelper.isApiKeySet()) {
        promptForApiKey();
        if (!window.AiHelper.isApiKeySet()) {
            return; // User cancelled API key input
        }
    }
    
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
            filename,
            description
        };
    }).filter(item => item !== null);
    
    // Create incident data for AI enhancement
    const incidentData = {
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
        description,
        evidence
    };
    
    // Show processing indicator
    const aiProcessing = document.getElementById('ai-processing');
    const aiPreview = document.getElementById('ai-preview');
    
    if (aiProcessing) {
        aiProcessing.classList.remove('hidden');
    }
    
    if (aiPreview) {
        aiPreview.classList.add('hidden');
    }
    
    try {
        // Call AI helper to enhance content
        const enhancedData = await window.AiHelper.enhanceIncidentContent(incidentData);
        
        // Store enhanced data
        enhancedIncidentData = enhancedData;
        
        // Hide processing indicator
        if (aiProcessing) {
            aiProcessing.classList.add('hidden');
        }
        
        // Show preview
        const previewContent = document.getElementById('ai-preview-content');
        if (previewContent && aiPreview) {
            previewContent.innerHTML = `
                <h4>Title (English):</h4>
                <p>${enhancedData.title.en}</p>
                <h4>Title (Japanese):</h4>
                <p>${enhancedData.title.ja}</p>
                <h4>Description (English):</h4>
                <p>${enhancedData.description.en}</p>
                <h4>Description (Japanese):</h4>
                <p>${enhancedData.description.ja}</p>
                <h4>Evidence:</h4>
                <ul>
                    ${enhancedData.evidence.map(e => `
                        <li>
                            <strong>${e.type}:</strong> ${e.url.split('/').pop()}<br>
                            <em>EN: ${e.description.en}</em><br>
                            <em>JA: ${e.description.ja}</em>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            aiPreview.classList.remove('hidden');
        }
    } catch (error) {
        // Hide processing indicator
        if (aiProcessing) {
            aiProcessing.classList.add('hidden');
        }
        
        // Show error
        alert(`Error: ${error.message}`);
        console.error('AI enhancement error:', error);
    }
}

/**
 * Accept AI enhancement
 */
function acceptAiEnhancement() {
    if (!enhancedIncidentData) return;
    
    // Update form with enhanced data
    const titleEnInput = document.getElementById('incident-title-en');
    const titleJaInput = document.getElementById('incident-title-ja');
    const descriptionInput = document.getElementById('incident-description');
    
    if (titleEnInput) {
        titleEnInput.value = enhancedIncidentData.title.en;
    }
    
    if (titleJaInput) {
        titleJaInput.value = enhancedIncidentData.title.ja;
    }
    
    if (descriptionInput) {
        descriptionInput.value = enhancedIncidentData.description.en;
    }
    
    // Hide preview
    const aiPreview = document.getElementById('ai-preview');
    if (aiPreview) {
        aiPreview.classList.add('hidden');
    }
}

/**
 * Reject AI enhancement
 */
function rejectAiEnhancement() {
    // Clear enhanced data
    enhancedIncidentData = null;
    
    // Hide preview
    const aiPreview = document.getElementById('ai-preview');
    if (aiPreview) {
        aiPreview.classList.add('hidden');
    }
}

/**
 * Update add incident form with current language
 */
function updateAddIncidentForm() {
    // Update form heading
    const addIncidentHeading = document.getElementById('add-incident-heading');
    if (addIncidentHeading) {
        addIncidentHeading.textContent = translations[currentLanguage].addNewIncident;
    }
    
    // Update form labels and placeholders
    const labelMappings = {
        'incident-date-label': 'date',
        'incident-time-label': 'time',
        'incident-title-en-label': 'titleEn',
        'incident-title-ja-label': 'titleJa',
        'incident-category-label': 'category',
        'incident-description-label': 'description',
        'incident-evidence-label': 'evidenceFiles'
    };
    
    for (const [elementId, translationKey] of Object.entries(labelMappings)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = translations[currentLanguage][translationKey];
        }
    }
    
    // Update buttons
    const buttonMappings = {
        'ai-enhance-btn': 'enhanceWithAI',
        'save-incident-btn': 'saveIncident',
        'accept-ai-btn': 'accept',
        'reject-ai-btn': 'reject'
    };
    
    for (const [elementId, translationKey] of Object.entries(buttonMappings)) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = translations[currentLanguage][translationKey];
        }
    }
    
    // Update AI processing text
    const aiProcessingText = document.getElementById('ai-processing-text');
    if (aiProcessingText) {
        aiProcessingText.textContent = translations[currentLanguage].processingWithAI;
    }
    
    // Update AI preview heading
    const aiPreviewHeading = document.getElementById('ai-preview-heading');
    if (aiPreviewHeading) {
        aiPreviewHeading.textContent = translations[currentLanguage].aiEnhancedContent;
    }
    
    // Update evidence input placeholders
    const evidenceInputs = document.querySelectorAll('.evidence-input-row');
    evidenceInputs.forEach(row => {
        const filenameInput = row.querySelector('.evidence-filename');
        const descriptionInput = row.querySelector('.evidence-description');
        
        if (filenameInput) filenameInput.placeholder = translations[currentLanguage].filename;
        if (descriptionInput) descriptionInput.placeholder = translations[currentLanguage].evidenceDescription;
    });
    
    // Update category dropdown
    populateCategoryDropdown();
}

// Export functions to window object
window.AddIncident = {
    init: initAddIncidentForm,
    update: updateAddIncidentForm
};
