let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 10;
let statusMessageDiv;
let emailDisplayUI;
let emailLinksContainer;
let emailSubjectDiv;
let propertySearchUI;
let propertySearchInput;
let propertySearchResults;
let allEmails = [];
let currentEmailSubject = null;
let allProperties = [];
let propertiesLoaded = false;
let propertiesLoading = false;

function initializeElements() {
    emailDisplayUI = document.getElementById('emailDisplayUI');
    emailLinksContainer = document.getElementById('emailLinksContainer');
    emailSubjectDiv = document.getElementById('emailSubject');
    statusMessageDiv = document.getElementById('statusMessage');
    propertySearchUI = document.getElementById('propertySearchUI');
    propertySearchInput = document.getElementById('propertySearchInput');
    propertySearchResults = document.getElementById('propertySearchResults');
}

function showStatus(message, type = 'loading') {
    if (!statusMessageDiv) return;

    statusMessageDiv.textContent = message;
    statusMessageDiv.className = `mv-alert mv-alert-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'secondary'}`;
    statusMessageDiv.classList.remove('hidden');

    if (type === 'error' || type === 'info') {
        if (emailDisplayUI) emailDisplayUI.classList.add('hidden');
    }
}

function displayEmailOptions(emails, subject = null) {
    if (emails && emails.length > 0) {
        allEmails = emails;
        currentEmailSubject = subject;

        if (emailLinksContainer) {
            const uniqueEmails = [...new Set(emails)];
            emailLinksContainer.innerHTML = uniqueEmails.map(email => 
                `<a href="#" class="email-link mv-list-group-item mv-list-group-item-action" data-email="${email}">${email}</a>`
            ).join('');

            // Add event listeners
            emailLinksContainer.addEventListener('click', (event) => {
                if (event.target.matches('.email-link')) {
                    event.preventDefault();
                    searchForEmail(event.target.dataset.email);
                }
            });
        }

        if (emailSubjectDiv) emailSubjectDiv.classList.add('hidden');
        if (emailDisplayUI) emailDisplayUI.classList.remove('hidden');
        if (statusMessageDiv) statusMessageDiv.classList.add('hidden');
    } else {
        showStatus('Could not find any email addresses in this conversation.', 'info');
        if (emailDisplayUI) emailDisplayUI.classList.add('hidden');
    }
}

function searchForEmail(selectedEmail) {
    if (selectedEmail) {
        showStatus(`Searching for ${selectedEmail}...`, 'loading');
        if (emailDisplayUI) emailDisplayUI.classList.add('hidden');

        const panelUrl = `/missive-panel?senderEmail=${encodeURIComponent(selectedEmail)}`;
        console.log(`[Missive Integration Script] Redirecting to panel: ${panelUrl}`);
        window.location.href = panelUrl;
    } else {
        showStatus('Invalid email address.', 'error');
    }
}

const handleConversationsChange = (ids) => {
    console.log('[Missive Integration Script] handleConversationsChange called with IDs:', ids);
    if (emailDisplayUI) emailDisplayUI.classList.add('hidden');
    allEmails = [];

    if (ids && ids.length === 1) {
        showStatus('Fetching email addresses from Missive...', 'loading');

        if (typeof Missive !== 'undefined' && Missive.fetchConversations) {
            Missive.fetchConversations(ids, ['email_addresses', 'latest_message'])
                .then((conversations) => {
                    if (conversations && conversations.length === 1) {
                        const conversation = conversations[0];
                        console.log('[Missive Integration Script] Conversation data:', conversation);

                        const emailAddresses = Missive.getEmailAddresses(conversations);
                        console.log('[Missive Integration Script] All email addresses:', emailAddresses);

                        const emailStrings = emailAddresses.map(email => {
                            if (typeof email === 'string') return email;
                            if (email && typeof email === 'object') {
                                return email.email || email.address || String(email);
                            }
                            return String(email);
                        });

                        let emailSubject = null;
                        if (conversation.latest_message && conversation.latest_message.subject) {
                            emailSubject = conversation.latest_message.subject.trim();
                        }

                        displayEmailOptions(emailStrings, emailSubject);
                    } else {
                        showStatus('Could not fetch unique conversation details.', 'error');
                    }
                })
                .catch((error) => {
                    showStatus(`Error fetching conversation data: ${error.message}`, 'error');
                    console.error('[Missive Integration Script] Error:', error);
                });
        } else {
            showStatus('Missive API not fully loaded yet...', 'loading');
        }
    } else if (ids && ids.length > 1) {
        showStatus('Multiple conversations selected. Please select only one.', 'info');
    } else {
        showStatus('No conversation selected in Missive.', 'info');
    }
};

async function loadAllProperties() {
    if (propertiesLoaded || propertiesLoading) return;

    propertiesLoading = true;
    try {
        console.log('[Property Search] Loading properties...');
        const response = await fetch('/api/get-items-for-board/273895529');
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        allProperties = data.items || [];
        propertiesLoaded = true;
        console.log(`[Property Search] Loaded ${allProperties.length} properties`);
    } catch (error) {
        console.error('[Property Search] Error loading properties:', error);
        allProperties = [];
        propertiesLoaded = true;
        throw error;
    } finally {
        propertiesLoading = false;
    }
}

function searchProperties(searchTerm) {
    if (!searchTerm.trim()) {
        // Show all properties when search is empty
        if (propertiesLoaded && allProperties.length > 0) {
            displayPropertyResults(allProperties, '', allProperties.length);
        } else {
            if (propertySearchResults) propertySearchResults.classList.add('hidden');
        }
        return;
    }

    if (propertiesLoaded) {
        const search = searchTerm.toLowerCase();
        const filteredItems = allProperties.filter(item => {
            const itemName = (item.name || '').toLowerCase();
            const itemId = item.id.toString();
            return itemName.includes(search) || itemId.includes(search);
        });

        // Display all matching results
        displayPropertyResults(filteredItems, searchTerm, filteredItems.length);
        return;
    }

    // Show loading state
    if (propertySearchResults) {
        propertySearchResults.innerHTML = '<div style="padding: 10px; color: #586069;">Loading properties...</div>';
        propertySearchResults.classList.remove('hidden');
    }

    loadAllProperties()
        .then(() => searchProperties(searchTerm))
        .catch(error => {
            if (propertySearchResults) {
                propertySearchResults.innerHTML = `<div style="padding: 10px; color: #d73a49;">Error loading properties: ${error.message}</div>`;
                propertySearchResults.classList.remove('hidden');
            }
        });
}

function displayPropertyResults(items, searchTerm = '', totalMatches = null) {
    if (!propertySearchResults) return;

    let html = '';

    // Add result summary at the top when there are results
    if (items.length > 0) {
        if (searchTerm) {
            const totalCount = allProperties.length;
            html += `<div class="result-summary">Showing ${items.length} of ${totalCount} properties</div>`;
        } else {
            // When no search term, show all properties
            const totalCount = allProperties.length;
            html += `<div class="result-summary">Showing all ${totalCount} properties</div>`;
        }
    }

    if (items.length === 0) {
        if (searchTerm) {
            html += `<div style="padding: 10px; color: #586069;">No properties found matching "${searchTerm}"</div>`;
        } else {
            html += '<div style="padding: 10px; color: #586069;">No properties found</div>';
        }
    } else {
        html += items.map(item => 
            `<a href="/item-details/${item.id}" class="property-result-item mv-list-group-item mv-list-group-item-action">${item.name || 'Unnamed Property'} (ID: ${item.id})</a>`
        ).join('');
    }

    propertySearchResults.innerHTML = html;
    propertySearchResults.classList.remove('hidden');
}

function setupPropertySearch() {
    if (!propertySearchInput) return;

    propertySearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchProperties(propertySearchInput.value);
        }
    });

    let searchTimeout;
    propertySearchInput.addEventListener('input', () => {
        const searchTerm = propertySearchInput.value.trim();

        // Clear any existing timeout
        clearTimeout(searchTimeout);

        if (!searchTerm) {
            if (propertySearchResults) propertySearchResults.classList.add('hidden');
            return;
        }

        // Show loading feedback immediately for better UX
        if (propertySearchResults) {
            propertySearchResults.innerHTML = '<div style="padding: 10px; color: #586069;">Searching...</div>';
            propertySearchResults.classList.remove('hidden');
        }

        // Debounce search to avoid excessive filtering while typing
        searchTimeout = setTimeout(() => {
            searchProperties(searchTerm);
        }, 150); // Reduced from 300ms to 150ms for better responsiveness
    });
}

function attemptMissiveInitialization() {
    initializationAttempts++;
    console.log(`[Missive Integration Script] Initialization attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS}`);

    if (typeof Missive !== 'undefined') {
        console.log('[Missive Integration Script] Missive API found!');

        try {
            Missive.on('change:conversations', handleConversationsChange);

            // Preload properties once
            if (!propertiesLoaded) {
                loadAllProperties().catch(error => {
                    console.warn('Failed to preload properties:', error);
                });
            }

            if (Missive.state && Missive.state.conversations) {
                if (Missive.state.conversations.length > 0) {
                    setTimeout(() => handleConversationsChange(Missive.state.conversations), 100);
                } else {
                    showStatus('No conversation selected in Missive.', 'info');
                }
            } else {
                showStatus('Waiting for Missive conversation data...', 'loading');
            }

            return true;
        } catch (error) {
            console.error('[Missive Integration Script] Error setting up Missive:', error);
            showStatus('Error initializing Missive connection.', 'error');
            return false;
        }
    } else {
        console.log('[Missive Integration Script] Missive API not yet available, waiting...');

        if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
            showStatus('Missive API not available. Please make sure this is loaded within Missive.', 'error');
            return false;
        }

        setTimeout(attemptMissiveInitialization, 500);
        return false;
    }
}

function initializeApp() {
    console.log('[Missive Integration Script] Starting app initialization...');

    initializeElements();
    setupPropertySearch();

    // Properties will be loaded when first search is performed

    showStatus('Connecting to Missive...', 'loading');
    attemptMissiveInitialization();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}