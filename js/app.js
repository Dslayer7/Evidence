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
    document.getElementById('key-quotes-label').textContent = translations[currentLanguage].keyQuotes || 'Files:';
    
    // Display or hide the original email button based on evidence type
    const originalEmailContainer = document.getElementById('original-email-container');
    const viewOriginalBtn = document.getElementById('view-original-btn');
    const viewOriginalText = document.getElementById('view-original-text');
    const viewTranslatedBtn = document.getElementById('view-translated-btn');
    const viewTranslatedText = document.getElementById('view-translated-text');
    
    // Remove any existing audio player if present
    const existingAudioContainer = document.getElementById('modal-audio-container');
    if (existingAudioContainer) {
        existingAudioContainer.remove();
    }
    
    // Handle audio evidence if present
    if (incident.original_evidence && incident.original_evidence.evidence_type === 'audio_recording' && 
        incident.original_evidence.audio_file_path) {
        // Show the original email container but repurpose it for audio
        originalEmailContainer.style.display = 'block';
        
        // Create audio container
        const audioContainer = document.createElement('div');
        audioContainer.id = 'modal-audio-container';
        audioContainer.className = 'audio-evidence-container';
        
        // Create audio player
        const audioPlayer = document.createElement('audio');
        audioPlayer.controls = true;
        audioPlayer.src = incident.original_evidence.audio_file_path;
        audioPlayer.style.width = '100%';
        
        // Add info about the recording
        let infoText = '';
        if (incident.original_evidence.recording_details) {
            const details = incident.original_evidence.recording_details;
            if (details.duration) {
                infoText += currentLanguage === 'en' ? 
                    `Duration: ${details.duration}` : 
                    `時間: ${details.duration}`;
            }
            if (details.incident_start) {
                infoText += infoText ? ' | ' : '';
                infoText += currentLanguage === 'en' ? 
                    `Incident starts at: ${details.incident_start}` : 
                    `事件開始時間: ${details.incident_start}`;
            }
        }
        
        const audioInfo = document.createElement('div');
        audioInfo.className = 'audio-info';
        audioInfo.textContent = infoText;
        
        // Add transcript if available
        if (incident.original_evidence.transcript && incident.original_evidence.transcript.length > 0) {
            const transcriptContainer = document.createElement('div');
            transcriptContainer.className = 'transcript-container';
            
            // Create header container to hold title and download button
            const headerContainer = document.createElement('div');
            headerContainer.className = 'transcript-header-container';
            
            const transcriptHeader = document.createElement('h4');
            transcriptHeader.textContent = 'Transcript / 文字起こし';
            transcriptHeader.className = 'transcript-title';
            
            // Create download PDF button
            const downloadPdfBtn = document.createElement('button');
            downloadPdfBtn.className = 'download-pdf-btn';
            downloadPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Download PDF';
            downloadPdfBtn.title = 'Download transcript as PDF';
            
            // Add event listener to download PDF
            downloadPdfBtn.addEventListener('click', () => {
                // Create a new window for the PDF content
                const printWindow = window.open('', '_blank', 'width=800,height=600');
                
                // Create the HTML content for the PDF
                let htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Audio Transcript - ${incident.title.en}</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #fff;
                        }
                        .container {
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #333;
                            border-bottom: 1px solid #ddd;
                            padding-bottom: 10px;
                        }
                        .info {
                            margin-bottom: 20px;
                            color: #666;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                        }
                        th, td {
                            padding: 8px;
                            border: 1px solid #ddd;
                            text-align: left;
                            vertical-align: top;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .transcript-speaker {
                            font-weight: bold;
                        }
                        .transcript-timestamp {
                            color: #666;
                            white-space: nowrap;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #999;
                        }
                        @media print {
                            body {
                                padding: 0;
                                background: none;
                            }
                            .container {
                                max-width: 100%;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
                </head>
                <body>
                    <div class="container" id="pdf-content">
                        <h1>${incident.title.en}</h1>
                        <div class="info">
                            <p><strong>Date:</strong> ${formatDate(incident.date)}</p>
                            <p><strong>Time:</strong> ${incident.time || 'Not specified'}</p>
                            <p><strong>Duration:</strong> ${incident.original_evidence.recording_details?.duration || 'Unknown'}</p>
                        </div>
                        <h2>Audio Transcript / 音声文字起こし</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Speaker</th>
                                    <th>Time</th>
                                    <th>English</th>
                                    <th>日本語</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                // Add each line of the transcript
                incident.original_evidence.transcript.forEach(line => {
                    htmlContent += `
                                <tr>
                                    <td class="transcript-speaker">${line.speaker}</td>
                                    <td class="transcript-timestamp">${line.timestamp}</td>
                                    <td>${line.text || ''}</td>
                                    <td>${line.text_ja || ''}</td>
                                </tr>
                    `;
                });
                
                // Close the table and add footer
                htmlContent += `
                            </tbody>
                        </table>
                        <div class="footer">
                            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                    <div class="no-print" style="text-align: center; margin-top: 20px;">
                        <button id="download-btn" style="padding: 10px 20px; background-color: #4a6fa5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                            <i class="fas fa-download"></i> Download PDF
                        </button>
                    </div>
                    <script>
                        document.getElementById('download-btn').addEventListener('click', function() {
                            const element = document.getElementById('pdf-content');
                            const opt = {
                                margin: [10, 10, 10, 10],
                                filename: '${incident.title.en.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.pdf',
                                image: { type: 'jpeg', quality: 0.98 },
                                html2canvas: { scale: 2 },
                                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                            };
                            
                            html2pdf().set(opt).from(element).save();
                        });
                        
                        // Auto-trigger download after 1 second
                        setTimeout(function() {
                            document.getElementById('download-btn').click();
                        }, 1000);
                    </script>
                </body>
                </html>
                `;
                
                // Write the HTML content to the new window
                printWindow.document.open();
                printWindow.document.write(htmlContent);
                printWindow.document.close();
            });
            
            // Add header and button to container
            headerContainer.appendChild(transcriptHeader);
            headerContainer.appendChild(downloadPdfBtn);
            transcriptContainer.appendChild(headerContainer);
            
            // Create bilingual transcript table
            const transcriptTable = document.createElement('table');
            transcriptTable.className = 'bilingual-transcript-table';
            
            // Create table header
            const tableHeader = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const speakerHeader = document.createElement('th');
            speakerHeader.textContent = 'Speaker';
            speakerHeader.className = 'transcript-speaker-header';
            
            const timestampHeader = document.createElement('th');
            timestampHeader.textContent = 'Time';
            timestampHeader.className = 'transcript-timestamp-header';
            
            const englishHeader = document.createElement('th');
            englishHeader.textContent = 'English';
            englishHeader.className = 'transcript-text-header';
            
            const japaneseHeader = document.createElement('th');
            japaneseHeader.textContent = '日本語';
            japaneseHeader.className = 'transcript-text-header';
            
            headerRow.appendChild(speakerHeader);
            headerRow.appendChild(timestampHeader);
            headerRow.appendChild(englishHeader);
            headerRow.appendChild(japaneseHeader);
            tableHeader.appendChild(headerRow);
            transcriptTable.appendChild(tableHeader);
            
            // Create table body
            const tableBody = document.createElement('tbody');
            
            incident.original_evidence.transcript.forEach(line => {
                const row = document.createElement('tr');
                row.className = 'transcript-row';
                
                // Speaker cell
                const speakerCell = document.createElement('td');
                speakerCell.className = 'transcript-speaker';
                speakerCell.textContent = line.speaker;
                
                // Timestamp cell
                const timestampCell = document.createElement('td');
                timestampCell.className = 'transcript-timestamp';
                timestampCell.textContent = line.timestamp;
                
                // Make timestamp clickable to jump to that point in the audio
                timestampCell.style.cursor = 'pointer';
                timestampCell.addEventListener('click', () => {
                    // Parse the timestamp (format: MM:SS.mmm)
                    const timeParts = line.timestamp.split(':');
                    if (timeParts.length === 2) {
                        const minutes = parseInt(timeParts[0], 10);
                        const seconds = parseFloat(timeParts[1]);
                        const totalSeconds = minutes * 60 + seconds;
                        
                        // Set the audio player's current time
                        audioPlayer.currentTime = totalSeconds;
                        
                        // Start playing from that point
                        audioPlayer.play();
                    }
                });
                
                // English text cell
                const englishCell = document.createElement('td');
                englishCell.className = 'transcript-text';
                englishCell.textContent = line.text || '';
                
                // Japanese text cell
                const japaneseCell = document.createElement('td');
                japaneseCell.className = 'transcript-text-ja';
                japaneseCell.textContent = line.text_ja || '';
                
                row.appendChild(speakerCell);
                row.appendChild(timestampCell);
                row.appendChild(englishCell);
                row.appendChild(japaneseCell);
                tableBody.appendChild(row);
            });
            
            transcriptTable.appendChild(tableBody);
            transcriptContainer.appendChild(transcriptTable);
            
            audioContainer.appendChild(audioInfo);
            audioContainer.appendChild(audioPlayer);
            audioContainer.appendChild(transcriptContainer);
        } else {
            // No transcript, just add the player
            audioContainer.appendChild(audioInfo);
            audioContainer.appendChild(audioPlayer);
        }
        
        // Add the audio container to the modal before the evidence container
        const evidenceContainer = document.querySelector('.evidence-container');
        evidenceContainer.parentNode.insertBefore(audioContainer, evidenceContainer);
        
        // Hide the original email buttons since we're showing audio
        viewOriginalBtn.style.display = 'none';
        viewTranslatedBtn.style.display = 'none';
    } else if (incident.original_evidence && incident.original_evidence.evidence_file_title && 
        incident.original_evidence.evidence_file_title.startsWith('email')) {
        // Original email handling
        originalEmailContainer.style.display = 'block';
        viewOriginalBtn.style.display = 'inline-block';
        viewTranslatedBtn.style.display = 'inline-block';
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
                
                // Handle audio evidence
                if (item.type === 'audio' && item.url) {
                    const audioContainer = document.createElement('div');
                    audioContainer.className = 'audio-evidence-container';
                    
                    // Create audio player
                    const audioPlayer = document.createElement('audio');
                    audioPlayer.controls = true;
                    audioPlayer.src = item.url;
                    
                    // Create play button for better UX
                    const playButton = document.createElement('button');
                    playButton.className = 'audio-play-button';
                    playButton.innerHTML = '<i class="fas fa-play"></i> ' + 
                        (currentLanguage === 'en' ? 'Play Audio' : '音声を再生');
                    
                    // Add information about the recording
                    const audioInfo = document.createElement('div');
                    audioInfo.className = 'audio-info';
                    
                    let infoText = '';
                    if (item.duration) {
                        infoText += currentLanguage === 'en' ? 
                            `Duration: ${item.duration}` : 
                            `時間: ${item.duration}`;
                    }
                    if (item.incident_start) {
                        infoText += infoText ? ' | ' : '';
                        infoText += currentLanguage === 'en' ? 
                            `Incident starts at: ${item.incident_start}` : 
                            `事件開始時間: ${item.incident_start}`;
                    }
                    
                    audioInfo.textContent = infoText;
                    
                    // Add event listener to play button
                    playButton.addEventListener('click', () => {
                        if (audioPlayer.paused) {
                            audioPlayer.play();
                            playButton.innerHTML = '<i class="fas fa-pause"></i> ' + 
                                (currentLanguage === 'en' ? 'Pause' : '一時停止');
                        } else {
                            audioPlayer.pause();
                            playButton.innerHTML = '<i class="fas fa-play"></i> ' + 
                                (currentLanguage === 'en' ? 'Play Audio' : '音声を再生');
                        }
                    });
                    
                    // Add event listener for when audio ends
                    audioPlayer.addEventListener('ended', () => {
                        playButton.innerHTML = '<i class="fas fa-play"></i> ' + 
                            (currentLanguage === 'en' ? 'Play Audio' : '音声を再生');
                    });
                    
                    // Append elements to container
                    audioContainer.appendChild(playButton);
                    audioContainer.appendChild(audioInfo);
                    audioContainer.appendChild(audioPlayer);
                    li.appendChild(audioContainer);
                }
                // If it's a transcript
                else if (item.type === 'transcript' && item.transcript) {
                    const transcriptContainer = document.createElement('div');
                    transcriptContainer.className = 'transcript-container';
                    transcriptContainer.style.display = 'none'; // Initially hidden
                    
                    // Create transcript content
                    const transcriptContent = document.createElement('div');
                    transcriptContent.className = 'transcript-content';
                    
                    // Add each line of the transcript
                    item.transcript.forEach(line => {
                        const transcriptLine = document.createElement('div');
                        transcriptLine.className = 'transcript-line';
                        
                        const speaker = document.createElement('span');
                        speaker.className = 'transcript-speaker';
                        speaker.textContent = line.speaker + ': ';
                        
                        const timestamp = document.createElement('span');
                        timestamp.className = 'transcript-timestamp';
                        timestamp.textContent = '[' + line.timestamp + '] ';
                        
                        const text = document.createElement('span');
                        text.className = 'transcript-text';
                        text.textContent = currentLanguage === 'en' ? line.text : line.text_ja;
                        
                        transcriptLine.appendChild(speaker);
                        transcriptLine.appendChild(timestamp);
                        transcriptLine.appendChild(text);
                        transcriptContent.appendChild(transcriptLine);
                    });
                    
                    transcriptContainer.appendChild(transcriptContent);
                    li.appendChild(transcriptContainer);
                    
                    // Make the item clickable to expand/collapse
                    span.style.cursor = 'pointer';
                    span.addEventListener('click', () => {
                        transcriptContainer.style.display = 
                            transcriptContainer.style.display === 'none' ? 'block' : 'none';
                    });
                }
                // If it's an internal reference to an email
                else if (item.url && item.url.startsWith('#') && item.url.includes('_email_')) {
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
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
                page-break-inside: avoid;
                break-inside: avoid;
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
            .save-pdf-btn {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 10px 15px;
                text-align: center;
                text-decoration: none;
                font-size: 16px;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                margin-bottom: 20px;
            }
            .save-pdf-btn:hover {
                background-color: #45a049;
            }
            .btn-container {
                text-align: right;
                margin-bottom: 20px;
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
                    break-inside: avoid;
                }
                .evidence-container {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .evidence-item {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                .evidence-item-content {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
                h1, h2, h3 {
                    page-break-after: avoid;
                    break-after: avoid;
                }
                .save-pdf-btn, .btn-container {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="container" id="content-to-pdf">
            <div class="btn-container">
                <button class="save-pdf-btn" id="save-as-pdf">Save as PDF</button>
            </div>
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
        <script>
            document.getElementById('save-as-pdf').addEventListener('click', function() {
                // Hide the button temporarily for PDF generation
                this.style.display = 'none';
                
                const element = document.getElementById('content-to-pdf');
                const filename = 'bilingual-evidence-${incident.date}-${incident.title.en.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf';
                
                const opt = {
                    margin: [15, 10, 15, 10],  // [top, right, bottom, left] margins
                    filename: filename,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };
                
                // Generate PDF
                html2pdf()
                    .set(opt)
                    .from(element)
                    .toPdf()
                    .get('pdf')
                    .then((pdf) => {
                        // Add page numbers
                        const totalPages = pdf.internal.getNumberOfPages();
                        for (let i = 1; i <= totalPages; i++) {
                            pdf.setPage(i);
                            pdf.setFontSize(10);
                            pdf.setTextColor(100);
                            pdf.text('Page ' + i + ' of ' + totalPages, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
                        }
                        return pdf;
                    })
                    .save()
                    .then(() => {
                        // Show the button again after PDF is generated
                        this.style.display = 'inline-block';
                    });
            });
        </script>
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
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString(
        currentLanguage === 'en' ? 'en-US' : 'ja-JP',
        { year: 'numeric', month: 'long', day: 'numeric' }
    );
}

// Get icon class based on evidence type
function getEvidenceIconClass(type) {
    switch (type) {
        case 'email':
            return 'fas fa-envelope';
        case 'document':
            return 'fas fa-file-alt';
        case 'image':
            return 'fas fa-image';
        case 'video':
            return 'fas fa-video';
        case 'audio':
            return 'fas fa-volume-up';
        case 'text':
            return 'fas fa-quote-left';
        case 'transcript':
            return 'fas fa-file-alt';
        default:
            return 'fas fa-file';
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

// Load incidents data from JSON files
function loadIncidents() {
    // First load the main evidence data
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
            
            // Now load the audio evidence data
            return fetch('audio_evidence.json');
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok for audio evidence');
            }
            return response.json();
        })
        .then(audioData => {
            // Process the audio evidence data and add it to the incidents array
            const audioIncidents = processEvidenceData(audioData.audio_incidents || []);
            incidents = [...incidents, ...audioIncidents];
            filteredIncidents = [...incidents];
            return incidents;
        })
        .catch(error => {
            console.error('Error loading incidents data:', error);
            // If we already have incidents from the first fetch, keep them
            if (!incidents.length) {
                incidents = [];
                filteredIncidents = [];
            }
            return incidents;
        });
}

// Process evidence data into a format suitable for display
function processEvidenceData(evidenceItems) {
    return evidenceItems.map(item => {
        // Extract date and time from the evidence
        let date = '';
        let time = '';
        
        // Try to extract date from the evidence file title
        if (item.evidence_file_title) {
            const dateMatch = item.evidence_file_title.match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                date = dateMatch[0];
            }
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
        
        // For audio evidence, get date and time from recording details
        if (item.evidence_type === 'audio_recording' && item.recording_details) {
            if (item.recording_details.date_recorded) {
                date = item.recording_details.date_recorded;
            }
            if (item.recording_details.time_recorded) {
                time = item.recording_details.time_recorded;
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
            en: item.full_summary || item.summary_for_lawyers || item.conversation_summary || '',
            ja: item.full_summary_ja || item.conversation_summary_ja || ''
        };
        
        // Create evidence array based on the key quotes and context
        let evidence = [];
        
        // We're no longer displaying key quotes as they don't provide additional help
        // Keeping this comment as a placeholder in case we need to restore this functionality
        
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
        
        // Process audio evidence if it exists
        if (item.evidence_type === 'audio_recording' && item.audio_file_path) {
            evidence.push({
                type: 'audio',
                url: item.audio_file_path,
                description: {
                    en: `Audio Recording (${item.recording_details?.duration || 'Unknown duration'})`,
                    ja: `音声記録 (${item.recording_details?.duration || '不明な時間'})`
                },
                duration: item.recording_details?.duration || '',
                incident_start: item.recording_details?.incident_start || ''
            });
            
            // We'll display the transcript directly in the modal, so we don't need to add it as a separate evidence item
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
