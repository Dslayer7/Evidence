// Global variables
let incidents = [];
let filteredIncidents = [];
let currentLanguage = 'en';
let currentView = 'timeline';
let selectedDate = null;
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let currentIncident = null; // Added variable to keep track of the current incident

// DOM elements
const navLinks = document.querySelectorAll('.nav-link');
const views = document.querySelectorAll('.view');
const languageToggle = document.getElementById('language-toggle');

// Initialize the application
function init() {
    // Set default language based on browser
    const browserLang = navigator.language.split('-')[0];
    currentLanguage = browserLang === 'ja' ? 'ja' : 'en';
    
    // Update language toggle buttons
    const langEn = document.getElementById('lang-en');
    const langJa = document.getElementById('lang-ja');
    
    if (currentLanguage === 'ja') {
        langJa.classList.add('active');
        langEn.classList.remove('active');
    } else {
        langEn.classList.add('active');
        langJa.classList.remove('active');
    }
    
    // Load incidents data
    loadIncidents()
        .then(() => {
            // Update UI with current language
            updateLanguage();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize timeline view
            initTimelineView();
            
            // Show default view (timeline)
            showView('timeline');
        });
}

// Initialize timeline view
function initTimelineView() {
    updateTimelineView();
    createMonthSelector();
}

// Create a month selector dropdown for the timeline view
function createMonthSelector() {
    // Check if the selector already exists and remove it if it does
    const existingSelector = document.getElementById('month-selector-container');
    if (existingSelector) {
        existingSelector.remove();
    }
    
    // Create selector container
    const selectorContainer = document.createElement('div');
    selectorContainer.id = 'month-selector-container';
    selectorContainer.className = 'month-selector-container';
    
    // Create label
    const label = document.createElement('label');
    label.htmlFor = 'month-selector';
    label.textContent = currentLanguage === 'en' ? 'Filter by Month:' : '月で絞り込み:';
    selectorContainer.appendChild(label);
    
    // Create select element
    const selector = document.createElement('select');
    selector.id = 'month-selector';
    selector.className = 'month-selector';
    
    // Add "All" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = currentLanguage === 'en' ? 'All Incidents' : 'すべての事件';
    selector.appendChild(allOption);
    
    // Get unique months from incidents
    const months = {};
    
    incidents.forEach(incident => {
        if (incident.date) {
            const date = new Date(incident.date);
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;
            
            if (!months[key]) {
                months[key] = {
                    year: year,
                    month: month,
                    count: 0
                };
            }
            
            months[key].count++;
        }
    });
    
    // Convert to array and sort (newest first)
    const monthArray = Object.values(months).sort((a, b) => {
        if (a.year !== b.year) {
            return b.year - a.year; // Newest year first
        }
        return b.month - a.month; // Newest month within year first
    });
    
    // Create month options
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthNamesJa = [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    
    monthArray.forEach(monthData => {
        const option = document.createElement('option');
        option.value = `${monthData.year}-${monthData.month}`;
        
        const monthName = currentLanguage === 'en' 
            ? monthNames[monthData.month] 
            : monthNamesJa[monthData.month];
        
        option.textContent = `${monthName} ${monthData.year} (${monthData.count})`;
        selector.appendChild(option);
    });
    
    // Add change event
    selector.addEventListener('change', function() {
        const selectedValue = this.value;
        filterTimelineByMonth(selectedValue);
    });
    
    selectorContainer.appendChild(selector);
    
    // Insert before the timeline container
    const timelineContainer = document.getElementById('timeline-container');
    const timelineView = document.getElementById('timeline-view');
    timelineView.insertBefore(selectorContainer, timelineContainer);
}

// Filter timeline by selected month
function filterTimelineByMonth(selectedValue) {
    if (selectedValue === 'all') {
        // Show all incidents
        filteredIncidents = [...incidents];
    } else {
        // Filter by month
        const [year, month] = selectedValue.split('-').map(n => parseInt(n, 10));
        
        filteredIncidents = incidents.filter(incident => {
            if (!incident.date) return false;
            
            const date = new Date(incident.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }
    
    // Update timeline view with filtered incidents
    updateTimelineView();
}

// Update UI with current language
function updateLanguage() {
    // Update navigation text
    document.querySelector('#calendar-nav .nav-text').textContent = translations[currentLanguage].calendar || 'Calendar View';
    document.querySelector('#timeline-nav .nav-text').textContent = translations[currentLanguage].timeline || 'Timeline View';
    
    // Update language toggle buttons
    const langEn = document.getElementById('lang-en');
    const langJa = document.getElementById('lang-ja');
    
    if (langEn && langJa) {
        if (currentLanguage === 'en') {
            langEn.classList.add('active');
            langJa.classList.remove('active');
        } else {
            langJa.classList.add('active');
            langEn.classList.remove('active');
        }
    }
    
    // Update the month selector if it exists
    if (document.getElementById('month-selector-container')) {
        createMonthSelector();
    }
    
    // Update views based on current view
    if (currentView === 'calendar') {
        updateCalendarView();
    } else if (currentView === 'timeline') {
        updateTimelineView();
    }
    
    // Update modal content if it's open
    const modal = document.getElementById('incident-modal');
    if (modal && modal.style.display === 'block' && currentIncident) {
        showIncidentModal(currentIncident);
    }
}

// Update timeline view
function updateTimelineView() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';
    
    // Sort incidents by date in descending order (newest to oldest)
    const sortedIncidents = [...filteredIncidents].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA; // Reverse order (newest first)
    });
    
    // Group incidents by month/year
    const groupedIncidents = {};
    
    sortedIncidents.forEach(incident => {
        if (!incident.date) return; // Skip if no date
        
        const date = new Date(incident.date);
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const key = `${year}-${month}`;
        
        if (!groupedIncidents[key]) {
            groupedIncidents[key] = {
                year: year,
                month: month,
                incidents: []
            };
        }
        
        groupedIncidents[key].incidents.push(incident);
    });
    
    // Create timeline groups
    Object.values(groupedIncidents).forEach(group => {
        // Create month/year header
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthNamesJa = [
            '1月', '2月', '3月', '4月', '5月', '6月',
            '7月', '8月', '9月', '10月', '11月', '12月'
        ];
        
        const monthYear = document.createElement('div');
        monthYear.className = 'timeline-month-year';
        monthYear.textContent = currentLanguage === 'en' 
            ? `${monthNames[group.month]} ${group.year}` 
            : `${group.year}年 ${monthNamesJa[group.month]}`;
        
        container.appendChild(monthYear);
        
        // Sort incidents within the group by date in descending order
        group.incidents.sort((a, b) => {
            // First compare by date
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            const dateDiff = dateB - dateA;
            
            // If same date, compare by time
            if (dateDiff === 0) {
                const timeA = a.time ? a.time.split(':') : [0, 0];
                const timeB = b.time ? b.time.split(':') : [0, 0];
                const hoursA = parseInt(timeA[0], 10);
                const hoursB = parseInt(timeB[0], 10);
                
                if (hoursA !== hoursB) {
                    return hoursB - hoursA;
                }
                
                const minutesA = parseInt(timeA[1], 10);
                const minutesB = parseInt(timeB[1], 10);
                return minutesB - minutesA;
            }
            
            return dateDiff;
        });
        
        // Create incident items
        group.incidents.forEach(incident => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.setAttribute('data-incident-id', incident.id);
            
            const date = new Date(incident.date);
            const day = date.getDate();
            
            const header = document.createElement('div');
            header.className = 'timeline-item-header';
            
            const dayEl = document.createElement('div');
            dayEl.className = 'timeline-item-day';
            dayEl.textContent = day;
            
            const title = document.createElement('div');
            title.className = 'timeline-item-title';
            title.textContent = currentLanguage === 'en' ? incident.title.en : incident.title.ja;
            
            header.appendChild(dayEl);
            header.appendChild(title);
            
            const content = document.createElement('div');
            content.className = 'timeline-item-content';
            
            const time = document.createElement('div');
            time.className = 'timeline-item-time';
            time.textContent = incident.time || '';
            
            const category = document.createElement('div');
            category.className = 'timeline-item-category';
            category.textContent = currentLanguage === 'en' ? incident.category.en : incident.category.ja;
            
            const description = document.createElement('div');
            description.className = 'timeline-item-description';
            
            // Get a short excerpt of the description
            const descText = currentLanguage === 'en' ? incident.description.en : incident.description.ja;
            description.textContent = descText ? `${descText.substring(0, 150)}${descText.length > 150 ? '...' : ''}` : '';
            
            // Add email summary if this is an email and we're in Japanese mode
            if (currentLanguage === 'ja' && incident.original_evidence && 
                incident.original_evidence.email_thread_details && 
                incident.original_evidence.email_thread_details.conversation_flow && 
                incident.original_evidence.email_thread_details.conversation_flow.length > 0) {
                
                const firstEmail = incident.original_evidence.email_thread_details.conversation_flow[0];
                if (firstEmail.body_summary_JA) {
                    // If we have a Japanese email body summary, use it instead of the description
                    description.textContent = firstEmail.body_summary_JA.substring(0, 150) + (firstEmail.body_summary_JA.length > 150 ? '...' : '');
                }
            }
            
            const viewButton = document.createElement('button');
            viewButton.className = 'view-incident-btn';
            viewButton.textContent = currentLanguage === 'en' ? 'View Details' : '詳細を見る';
            viewButton.addEventListener('click', () => {
                showIncidentModal(incident);
            });
            
            content.appendChild(time);
            content.appendChild(category);
            content.appendChild(description);
            content.appendChild(viewButton);
            
            item.appendChild(header);
            item.appendChild(content);
            
            container.appendChild(item);
        });
    });
    
    // If no incidents, show a message
    if (sortedIncidents.length === 0) {
        const noIncidents = document.createElement('div');
        noIncidents.className = 'no-incidents';
        noIncidents.textContent = currentLanguage === 'en' ? 'No incidents found' : '事件が見つかりません';
        container.appendChild(noIncidents);
    }
}

// Show incident details in modal
function showIncidentModal(incident) {
    currentIncident = incident; // Store the current incident
    
    const modal = document.getElementById('incident-modal');
    
    // Populate modal with incident details
    document.getElementById('modal-title').textContent = currentLanguage === 'en' ? incident.title.en : incident.title.ja;
    
    // Set date and time
    document.getElementById('modal-date').textContent = formatDate(incident.date);
    document.getElementById('modal-time').textContent = incident.time;
    
    // Set category
    document.getElementById('modal-category').textContent = currentLanguage === 'en' ? incident.category.en : incident.category.ja;
    
    // Set description
    document.getElementById('modal-description').textContent = currentLanguage === 'en' ? incident.description.en : incident.description.ja;
    
    // Update labels based on current language
    document.getElementById('date-label').textContent = translations[currentLanguage].date || 'Date:';
    document.getElementById('time-label').textContent = translations[currentLanguage].time || 'Time:';
    document.getElementById('category-label').textContent = translations[currentLanguage].category || 'Category:';
    document.getElementById('description-label').textContent = translations[currentLanguage].description || 'Description:';
    document.getElementById('key-quotes-label').textContent = translations[currentLanguage].keyQuotes || 'Key-quotes:';
    
    // Display or hide the original email button based on evidence type
    const originalEmailContainer = document.getElementById('original-email-container');
    const viewOriginalBtn = document.getElementById('view-original-btn');
    const viewOriginalText = document.getElementById('view-original-text');
    const viewTranslatedBtn = document.getElementById('view-translated-btn');
    const viewTranslatedText = document.getElementById('view-translated-text');
    
    if (incident.original_evidence && incident.original_evidence.evidence_file_title && 
        incident.original_evidence.evidence_file_title.startsWith('email')) {
        originalEmailContainer.style.display = 'block';
        viewOriginalText.textContent = translations[currentLanguage].viewOriginalEmail || 'View Original Email';
        viewTranslatedText.textContent = translations[currentLanguage].viewBilingualEvidence || 'View Bilingual Evidence';
        
        // Add click event for the original email button
        viewOriginalBtn.onclick = function() {
            showPdfViewer(incident.original_evidence.evidence_file_title);
        };
        
        // Add click event for the bilingual evidence button
        viewTranslatedBtn.onclick = function() {
            showBilingualEvidence(incident);
        };
    } else {
        originalEmailContainer.style.display = 'none';
    }
    
    // Clear previous evidence list
    const evidenceList = document.getElementById('modal-evidence');
    evidenceList.innerHTML = '';
    
    // Add evidence items
    if (incident.evidence && incident.evidence.length > 0) {
        incident.evidence.forEach(item => {
            const li = document.createElement('li');
            li.className = 'evidence-item';
            
            if (item.url && !item.url.startsWith('#')) {
                // External evidence link
                const a = document.createElement('a');
                a.href = item.url;
                a.target = '_blank';
                a.className = 'evidence-link';
                
                const icon = document.createElement('i');
                icon.className = getEvidenceIconClass(item.type);
                a.appendChild(icon);
                
                const span = document.createElement('span');
                span.textContent = currentLanguage === 'en' ? item.description.en : item.description.ja;
                a.appendChild(span);
                
                li.appendChild(a);
            } else {
                // Internal evidence (like email content) or no URL
                const icon = document.createElement('i');
                icon.className = getEvidenceIconClass(item.type);
                li.appendChild(icon);
                
                const span = document.createElement('span');
                span.textContent = currentLanguage === 'en' ? item.description.en : item.description.ja;
                li.appendChild(span);
                
                // If it's an internal reference to an email
                if (item.url && item.url.startsWith('#') && item.url.includes('_email_')) {
                    const detailsContainer = document.createElement('div');
                    detailsContainer.className = 'evidence-details';
                    
                    // If this is an email reference, extract the email data
                    const [evidenceId, emailIndex] = item.url.replace('#', '').split('_email_');
                    const evidenceItem = incidents.find(inc => inc.id === evidenceId);
                    
                    if (evidenceItem && evidenceItem.original_evidence) {
                        const emailData = evidenceItem.original_evidence.email_thread_details.conversation_flow[emailIndex];
                        if (emailData) {
                            // Add email details
                            const emailContent = document.createElement('div');
                            emailContent.className = 'email-content';
                            
                            const headerDiv = document.createElement('div');
                            headerDiv.className = 'email-header';
                            headerDiv.innerHTML = `
                                <p><strong>From:</strong> ${emailData.sender}</p>
                                <p><strong>To:</strong> ${emailData.recipients.join('; ')}</p>
                                ${emailData.cc ? `<p><strong>CC:</strong> ${emailData.cc.join('; ')}</p>` : ''}
                                <p><strong>Subject:</strong> ${emailData.subject}</p>
                                <p><strong>Date:</strong> ${emailData.date_sent}</p>
                            `;
                            
                            const bodyDiv = document.createElement('div');
                            bodyDiv.className = 'email-body';
                            bodyDiv.innerText = currentLanguage === 'en' ? emailData.body : (emailData.body_JA || emailData.body);
                            
                            emailContent.appendChild(headerDiv);
                            emailContent.appendChild(bodyDiv);
                            detailsContainer.appendChild(emailContent);
                            li.appendChild(detailsContainer);
                            
                            // Make the item clickable to expand/collapse
                            span.style.cursor = 'pointer';
                            span.addEventListener('click', () => {
                                detailsContainer.style.display = detailsContainer.style.display === 'none' ? 'block' : 'none';
                            });
                            detailsContainer.style.display = 'none'; // Initially hidden
                        }
                    }
                }
            }
            
            evidenceList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = currentLanguage === 'en' ? 'No evidence available' : '証拠はありません';
        evidenceList.appendChild(li);
    }
    
    // Remove any previously added harassment indicators
    const existingIndicators = document.querySelector('.harassment-indicators');
    if (existingIndicators) {
        existingIndicators.remove();
    }
    
    // If original evidence data contains potential harassment indicators, add them
    if (incident.original_evidence && incident.original_evidence.potential_indicators_of_power_harassment) {
        const incidentDetails = document.querySelector('.incident-details');
        
        // Create a container for the collapsible section
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'harassment-indicators-container';
        
        // Create a header that will be clickable
        const indicatorsHeader = document.createElement('div');
        indicatorsHeader.className = 'harassment-indicators-header';
        indicatorsHeader.innerHTML = `
            <h4>${currentLanguage === 'en' ? 'Potential Harassment Indicators' : 'ハラスメントの可能性を示す指標'}</h4>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Create the content container that will be collapsible
        const indicatorsContent = document.createElement('div');
        indicatorsContent.className = 'harassment-indicators';
        // Initially hidden
        indicatorsContent.style.display = 'none';
        
        // Add the indicators to the content container
        const indicatorsList = document.createElement('ul');
        if (incident.original_evidence.potential_indicators_of_power_harassment && 
            incident.original_evidence.potential_indicators_of_power_harassment.length > 0) {
            
            incident.original_evidence.potential_indicators_of_power_harassment.forEach(indicator => {
                const li = document.createElement('li');
                li.textContent = indicator;
                indicatorsList.appendChild(li);
            });
        } else {
            // If no indicators exist, add a placeholder message
            const li = document.createElement('li');
            li.textContent = currentLanguage === 'en' ? 'No specific indicators identified' : '特定の指標は確認されていません';
            indicatorsList.appendChild(li);
        }
        
        indicatorsContent.appendChild(indicatorsList);
        
        // Add click event to toggle display
        indicatorsHeader.onclick = function() {
            // Toggle display
            const isHidden = indicatorsContent.style.display === 'none';
            indicatorsContent.style.display = isHidden ? 'block' : 'none';
            this.querySelector('i').className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        };
        
        // Assemble the components
        indicatorsContainer.appendChild(indicatorsHeader);
        indicatorsContainer.appendChild(indicatorsContent);
        
        // Add to the modal
        incidentDetails.appendChild(indicatorsContainer);
    }

    // Show the modal
    document.getElementById('incident-modal').style.display = 'block';
    
    // Close modal when clicking on X
    const closeBtn = document.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Function to show bilingual evidence in a new window
function showBilingualEvidence(incident) {
    // Create a new window
    const bilingualWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    
    // Create the HTML content for the new window
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bilingual Evidence - ${incident.title.en}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #333;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .evidence-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 30px;
            }
            .evidence-column {
                flex: 1;
                min-width: 300px;
            }
            .evidence-header {
                background-color: #f0f0f0;
                padding: 10px;
                border-radius: 5px 5px 0 0;
                font-weight: bold;
                margin-bottom: 10px;
            }
            .evidence-content {
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 0 0 5px 5px;
                background-color: #fff;
            }
            .evidence-item {
                margin-bottom: 20px;
                border: 1px solid #eee;
                border-radius: 5px;
                overflow: hidden;
            }
            .evidence-item-header {
                background-color: #f8f8f8;
                padding: 10px;
                font-weight: bold;
                border-bottom: 1px solid #eee;
            }
            .evidence-item-content {
                padding: 15px;
            }
            .metadata {
                margin-bottom: 20px;
                padding: 10px;
                background-color: #f8f8f8;
                border-radius: 5px;
            }
            .metadata p {
                margin: 5px 0;
            }
            @media print {
                body {
                    background-color: #fff;
                }
                .container {
                    box-shadow: none;
                    max-width: 100%;
                }
                .evidence-column {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Bilingual Evidence: ${incident.title.en} / ${incident.title.ja}</h1>
            
            <div class="metadata">
                <p><strong>Date:</strong> ${formatDate(incident.date)}</p>
                <p><strong>Evidence Type:</strong> ${incident.category.en} / ${incident.category.ja}</p>
            </div>
    `;
    
    // Add summary section if available
    if (incident.original_evidence && (incident.original_evidence.full_summary || incident.original_evidence.summary_for_lawyers)) {
        htmlContent += `
            <div class="evidence-container">
                <div class="evidence-column">
                    <div class="evidence-header">Summary (English)</div>
                    <div class="evidence-content">${incident.original_evidence.full_summary || incident.original_evidence.summary_for_lawyers}</div>
                </div>
                <div class="evidence-column">
                    <div class="evidence-header">Summary (Japanese)</div>
                    <div class="evidence-content">${incident.original_evidence.full_summary_ja || 'No Japanese summary available'}</div>
                </div>
            </div>
        `;
    }
    
    // Handle email evidence
    if (incident.original_evidence && incident.original_evidence.evidence_type === 'email' && 
        incident.original_evidence.email_thread_details && 
        incident.original_evidence.email_thread_details.conversation_flow) {
        
        const emails = incident.original_evidence.email_thread_details.conversation_flow;
        
        htmlContent += `<h2>Email Thread</h2>`;
        
        emails.forEach((email, index) => {
            htmlContent += `
                <div class="evidence-item">
                    <div class="evidence-item-header">
                        Email ${index + 1}: ${email.subject}
                    </div>
                    <div class="evidence-container">
                        <div class="evidence-column">
                            <div class="evidence-header">English</div>
                            <div class="evidence-item-content">
                                <p><strong>From:</strong> ${email.sender}</p>
                                <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
                                ${email.cc && email.cc.length > 0 ? `<p><strong>CC:</strong> ${email.cc.join(', ')}</p>` : ''}
                                <p><strong>Date:</strong> ${email.date_sent}</p>
                                <p><strong>Subject:</strong> ${email.subject}</p>
                                <div style="white-space: pre-wrap; margin-top: 15px;">${email.body}</div>
                            </div>
                        </div>
                        <div class="evidence-column">
                            <div class="evidence-header">日本語</div>
                            <div class="evidence-item-content">
                                <p><strong>差出人:</strong> ${email.sender}</p>
                                <p><strong>宛先:</strong> ${email.recipients.join(', ')}</p>
                                ${email.cc && email.cc.length > 0 ? `<p><strong>CC:</strong> ${email.cc.join(', ')}</p>` : ''}
                                <p><strong>日付:</strong> ${email.date_sent}</p>
                                <p><strong>件名:</strong> ${email.subject}</p>
                                <div style="white-space: pre-wrap; margin-top: 15px;">${email.body_JA || '翻訳なし'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    // Handle meeting cancellation/postponement evidence
    else if (incident.original_evidence && 
            (incident.original_evidence.evidence_type === 'meeting_cancellation' || 
             incident.original_evidence.evidence_type === 'meeting_postponement') && 
            incident.original_evidence.meeting_details) {
        
        const meeting = incident.original_evidence.meeting_details;
        
        htmlContent += `
            <div class="evidence-item">
                <div class="evidence-item-header">
                    Meeting Details: ${meeting.subject}
                </div>
                <div class="evidence-container">
                    <div class="evidence-column">
                        <div class="evidence-header">English</div>
                        <div class="evidence-item-content">
                            <p><strong>Subject:</strong> ${meeting.subject}</p>
                            <p><strong>Organizer:</strong> ${meeting.organizer.name} (${meeting.organizer.email})</p>
                            <p><strong>Original Time:</strong> ${meeting.original_time}</p>
                            <p><strong>Location:</strong> ${meeting.location}</p>
                            ${meeting.recurrence ? `<p><strong>Recurrence:</strong> ${meeting.recurrence}</p>` : ''}
                            ${meeting.cancellation_sent_date ? `<p><strong>Cancellation Sent:</strong> ${meeting.cancellation_sent_date}</p>` : ''}
                            ${meeting.postponement_sent_date ? `<p><strong>Postponement Sent:</strong> ${meeting.postponement_sent_date}</p>` : ''}
                        </div>
                    </div>
                    <div class="evidence-column">
                        <div class="evidence-header">日本語</div>
                        <div class="evidence-item-content">
                            <p><strong>件名:</strong> ${meeting.subject}</p>
                            <p><strong>主催者:</strong> ${meeting.organizer.name} (${meeting.organizer.email})</p>
                            <p><strong>元の時間:</strong> ${meeting.original_time}</p>
                            <p><strong>場所:</strong> ${meeting.location}</p>
                            ${meeting.recurrence ? `<p><strong>繰り返し:</strong> ${meeting.recurrence}</p>` : ''}
                            ${meeting.cancellation_sent_date ? `<p><strong>キャンセル送信日:</strong> ${meeting.cancellation_sent_date}</p>` : ''}
                            ${meeting.postponement_sent_date ? `<p><strong>延期送信日:</strong> ${meeting.postponement_sent_date}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Close the HTML
    htmlContent += `
        </div>
    </body>
    </html>
    `;
    
    // Write the HTML to the new window
    bilingualWindow.document.write(htmlContent);
    bilingualWindow.document.close();
}

// Function to show PDF viewer
function showPdfViewer(filename) {
    // Create modal container if it doesn't exist
    let pdfModal = document.getElementById('pdf-modal');
    if (!pdfModal) {
        pdfModal = document.createElement('div');
        pdfModal.id = 'pdf-modal';
        pdfModal.className = 'modal pdf-modal';
        document.body.appendChild(pdfModal);
    }
    
    // Ensure filename has .pdf extension
    let pdfFileName = filename;
    if (!pdfFileName.toLowerCase().endsWith('.pdf')) {
        pdfFileName += '.pdf';
    }
    
    // Construct the PDF path
    const pdfPath = `email_evidence/${pdfFileName}`;
    
    // Create modal content
    pdfModal.innerHTML = `
        <div class="modal-content pdf-modal-content">
            <span class="close-modal pdf-close-btn">&times;</span>
            <h2>${filename}</h2>
            <object class="pdf-object" data="${pdfPath}" type="application/pdf">
                <p>It appears your browser doesn't support embedded PDFs. 
                <a href="${pdfPath}" class="pdf-download-link" download>Click here to download the PDF</a>.</p>
            </object>
            <div class="pdf-download-container">
                <a href="${pdfPath}" class="pdf-direct-download" download>${translations[currentLanguage].downloadPdf || 'Download PDF'}</a>
            </div>
        </div>
    `;
    
    // Show modal
    pdfModal.style.display = 'block';
    
    // Close modal on X click
    const closeBtn = pdfModal.querySelector('.pdf-close-btn');
    closeBtn.onclick = function() {
        pdfModal.style.display = 'none';
    };
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == pdfModal) {
            pdfModal.style.display = 'none';
        }
    };
}

// Format date based on current language
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
        currentLanguage === 'en' ? 'en-US' : 'ja-JP',
        { year: 'numeric', month: 'long', day: 'numeric' }
    );
}

// Get icon class based on evidence type
function getEvidenceIconClass(type) {
    switch (type) {
        case 'image':
            return 'fas fa-image';
        case 'document':
            return 'fas fa-file-alt';
        case 'audio':
            return 'fas fa-microphone';
        case 'video':
            return 'fas fa-video';
        default:
            return 'fas fa-link';
    }
}

// Function to translate evidence type to Japanese
function translateEvidenceType(type) {
    if (!type) return 'カテゴリーなし';
    
    const typeMap = {
        'email': 'メール',
        'document': '文書',
        'image': '画像',
        'audio': '音声',
        'video': '動画',
        'chat': 'チャット',
        'screenshot': 'スクリーンショット',
        'link': 'リンク'
    };
    
    return typeMap[type.toLowerCase()] || type;
}

// Set up event listeners
function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.view) { // Only add click listeners to tabs with data-view attribute
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all nav links
                document.querySelectorAll('.nav-link').forEach(navLink => {
                    navLink.classList.remove('active');
                });
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Show the corresponding view
                showView(link.dataset.view);
            });
        }
    });
    
    // Language toggle
    document.getElementById('lang-en').addEventListener('click', () => {
        currentLanguage = 'en';
        document.getElementById('lang-en').classList.add('active');
        document.getElementById('lang-ja').classList.remove('active');
        updateLanguage();
    });
    
    document.getElementById('lang-ja').addEventListener('click', () => {
        currentLanguage = 'ja';
        document.getElementById('lang-ja').classList.add('active');
        document.getElementById('lang-en').classList.remove('active');
        updateLanguage();
    });
    
    // Filter button
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.querySelector('.filter-dropdown');
    
    filterBtn.addEventListener('click', () => {
        filterDropdown.classList.toggle('show');
    });
    
    // Close filter dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (!e.target.matches('#filter-btn') && !e.target.closest('.filter-dropdown') && !e.target.closest('.flatpickr-calendar')) {
            if (filterDropdown.classList.contains('show')) {
                filterDropdown.classList.remove('show');
            }
        }
    });
    
    // Initialize date range picker
    flatpickr('#date-range', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        onChange: function(selectedDates) {
            dateRangeStart = selectedDates[0] ? selectedDates[0].toISOString().split('T')[0] : null;
            dateRangeEnd = selectedDates[1] ? selectedDates[1].toISOString().split('T')[0] : null;
        }
    });
    
    // Apply filters button
    document.getElementById('apply-filters').addEventListener('click', () => {
        applyFilters();
        filterDropdown.classList.remove('show');
    });
    
    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', () => {
        resetFilters();
        filterDropdown.classList.remove('show');
    });
    
    // Search button
    document.getElementById('search-btn').addEventListener('click', () => {
        const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
        searchIncidents(searchQuery);
    });
    
    // Search input - search on enter key
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
            searchIncidents(searchQuery);
        }
    });
}

// Show a specific view
function showView(view) {
    // Hide all views
    views.forEach(viewElement => {
        viewElement.classList.remove('active');
    });
    
    // Show the selected view
    const viewElement = document.getElementById(`${view}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
    }
    
    currentView = view;
    
    // Update UI based on the view
    if (view === 'calendar') {
        updateCalendarView();
        
        // Show the calendar when in calendar view
        document.getElementById('calendar-container').style.display = 'block';
    } else if (view === 'timeline') {
        updateTimelineView();
        
        // Hide the calendar when in timeline view
        if (document.getElementById('calendar-container')) {
            document.getElementById('calendar-container').style.display = 'none';
        }
    }
}

// Load incidents data from JSON file
function loadIncidents() {
    return fetch('evidence.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Process the evidence data into a structure for display
            incidents = processEvidenceData(data.incidents || []);
            filteredIncidents = [...incidents];
            return incidents;
        })
        .catch(error => {
            console.error('Error loading incidents data:', error);
            // Initialize with empty array if fetch fails
            incidents = [];
            filteredIncidents = [];
            return [];
        });
}

// Process evidence data into a format suitable for display
function processEvidenceData(evidenceItems) {
    return evidenceItems.map(item => {
        // Extract date from evidence file title if not explicitly provided
        let date = '';
        let time = '';
        
        // Try to extract date from evidence_file_title
        const dateMatch = item.evidence_file_title?.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
            date = dateMatch[1];
        }
        
        // For email evidence, get date from first email in thread
        if (item.evidence_type === 'email' && item.email_thread_details?.date_range?.first_email_sent) {
            const emailDateStr = item.email_thread_details.date_range.first_email_sent;
            // Extract time from the datetime string
            const timeMatch = emailDateStr.match(/(\d{1,2}:\d{2}(?: [AP]M)?)/);
            if (timeMatch) {
                time = timeMatch[1];
            }
            
            // If we couldn't extract date from the title, try from the email date
            if (!date) {
                const emailDateMatch = emailDateStr.match(/(\d{4}-\d{2}-\d{2})/);
                if (emailDateMatch) {
                    date = emailDateMatch[1];
                } else {
                    // Try to parse the date format like "2025-04-10 5:37 PM"
                    const parts = emailDateStr.split(' ');
                    if (parts.length >= 1) {
                        date = parts[0];
                    }
                }
            }
        }
        
        // Generate a unique ID based on the filename if none exists
        const id = item.id || item.evidence_file_title || `evidence_${Date.now()}`;
        
        // Use the new field names "full_summary" and "full_summary_ja" while maintaining backward compatibility with "summary_for_lawyers"
        let title = {
            en: item.title_en || item.evidence_file_title?.replace(/^(email|document|audio|video|image)\d+_\d{4}-\d{2}-\d{2}_/, "") || 'Untitled Evidence',
            ja: item.title_ja || item.evidence_file_title?.replace(/^(email|document|audio|video|image)\d+_\d{4}-\d{2}-\d{2}_/, "") || '無題の証拠'
        };
        
        // Format title only if we're using the generated title (not the explicit title_en/title_ja)
        if (!item.title_en) {
            title.en = title.en.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        }
        if (!item.title_ja) {
            title.ja = title.ja; // Keep Japanese as is or implement Japanese formatting if needed
        }
        
        // Determine category
        let category = {
            en: item.evidence_type ? item.evidence_type.charAt(0).toUpperCase() + item.evidence_type.slice(1) : 'Uncategorized',
            ja: translateEvidenceType(item.evidence_type)
        };
        
        // Create description
        let description = {
            en: item.full_summary || item.summary_for_lawyers || '',
            ja: item.full_summary_ja || ''
        };
        
        // Create evidence array based on the key quotes and context
        let evidence = [];
        
        // Add key quotes as evidence items
        if (item.key_quotes && item.key_quotes.length > 0) {
            evidence.push({
                type: 'text',
                url: '',
                description: {
                    en: 'Key quotes: ' + item.key_quotes.join('; '),
                    ja: '主要な引用: ' + item.key_quotes.join('; ')
                }
            });
        }
        
        // Process email thread if it exists
        if (item.evidence_type === 'email' && item.email_thread_details?.conversation_flow) {
            item.email_thread_details.conversation_flow.forEach((email, index) => {
                evidence.push({
                    type: 'document',
                    url: `#${id}_email_${index}`, // Create an anchor reference instead of file URL
                    description: {
                        en: `${email.sender.split('<')[0]} - ${email.subject}`,
                        ja: `${email.sender.split('<')[0]} - ${email.subject}`
                    }
                });
            });
        }
        
        return {
            id,
            date,
            time,
            title,
            category,
            description,
            evidence,
            original_evidence: item // Keep the original data for reference
        };
    });
}

init();
