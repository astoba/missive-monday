const express = require('express');
const router = express.Router();
const TARGET_BOARD_ID = "273895529";

// Common CSS styles for both item details and Missive panel
const commonStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 30px;
    background-color: #f8f9fa;
    color: #1c1e21;
    font-size: 16px;
    line-height: 1.5;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    background-color: #fff;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  h1 {
    color: #24292e;
    font-size: 1.8em;
    font-weight: 600;
    margin-bottom: 25px;
    text-align: center;
  }
  .field-group {
    margin-bottom: 25px;
    padding: 20px;
    border: 1px solid #e1e4e8;
    border-radius: 8px;
    background-color: #f6f8fa;
  }
  .field-group strong {
    font-size: 1.1em;
    color: #24292e;
    display: block;
    margin-bottom: 12px;
    font-weight: 600;
  }
  .field-group input[type="text"], .field-group input[type="email"], .field-group input[type="date"], .field-group select {
    width: calc(100% - 100px);
    padding: 12px;
    border: 1px solid #d1d5da;
    border-radius: 6px;
    font-size: 1em;
    margin-right: 15px;
    box-sizing: border-box;
    background-color: #ffffff;
  }
  .field-group button {
    background-color: #0366d6;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1em;
    font-weight: 500;
  }
  .field-group button:hover { background-color: #0256cc; }
  .field-group button:disabled { background-color: #959da5; }
  .columns-heading {
    font-size: 1.3em;
    color: #24292e;
    margin-top: 30px;
    margin-bottom: 20px;
    border-bottom: 1px solid #e1e4e8;
    padding-bottom: 10px;
    font-weight: 600;
  }
  .columns-grid {
    display: grid;
    grid-template-columns: minmax(150px, auto) 1fr minmax(100px, auto);
    gap: 15px 20px;
    align-items: center;
    margin-top: 20px;
  }
  .columns-grid .column-label {
    font-weight: 600;
    text-align: right;
    color: #586069;
    padding-right: 15px;
    font-size: 1em;
  }
  .columns-grid .column-input-value input[type="text"],
  .columns-grid .column-input-value input[type="email"],
  .columns-grid .column-input-value input[type="date"],
  .columns-grid .column-input-value select,
  .columns-grid .column-input-value .readonly-text {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5da;
    border-radius: 6px;
    box-sizing: border-box;
    font-size: 1em;
    background-color: #ffffff;
  }
  .columns-grid .column-input-value .readonly-text {
    background-color: #f6f8fa;
    color: #24292e;
    min-height: 40px;
    display: flex;
    align-items: center;
    padding-left: 12px;
  }
  .columns-grid .column-action button {
    padding: 10px 15px;
    font-size: 0.9em;
    background-color: #0366d6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
  }
  .columns-grid .column-action button:hover { background-color: #0256cc; }
  .columns-grid .column-action button:disabled { background-color: #959da5; }
  .columns-grid .column-message {
    grid-column: 2 / span 2;
    font-size: 0.9em;
    margin-top: -5px;
  }
  .error { color: #d73a49; font-weight: 600; }
  .loading {
    color: #586069;
    text-align: center;
    padding: 40px;
    font-size: 1.1em;
  }
  .no-match {
    color: #586069;
    text-align: center;
    padding: 40px;
    font-size: 1.1em;
  }
  .error-message {
    color: #d73a49;
    font-weight: 600;
    text-align: center;
    padding: 40px;
    font-size: 1.1em;
  }
  .message {
    margin-top: 10px;
    padding: 12px;
    border-radius: 6px;
    font-size: 0.9em;
    text-align: left;
  }
  .message.success {
    background-color: #e6ffed;
    color: #1f883d;
    border: 1px solid #a1dea7;
  }
  .message.error {
    background-color: #ffeef0;
    color: #d73a49;
    border: 1px solid #f9c9cd;
  }
  a {
    color: #0366d6;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .back-link {
    display: block;
    text-align: center;
    margin-top: 30px;
    padding: 12px 25px;
    background-color: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 6px;
    color: #0366d6;
    text-decoration: none;
    font-weight: 500;
  }
  .back-link:hover {
    background-color: #e1f5fe;
    text-decoration: none;
  }
  /* Home page specific styles */
  .search-container {
    margin-bottom: 20px;
  }
  #search-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5da;
    border-radius: 8px;
    font-size: 1em;
    background-color: #fff;
    box-sizing: border-box;
  }
  #search-input:focus {
    outline: none;
    border-color: #0366d6;
    box-shadow: 0 0 0 3px rgba(3, 102, 214, 0.1);
  }
  #search-results {
    color: #586069;
    font-size: 0.9em;
    margin: 10px 0 15px 0;
  }
  .items-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  .item-card {
    background-color: #f6f8fa;
    margin-bottom: 8px;
    padding: 16px 20px;
    border-radius: 8px;
    border: 1px solid #e1e4e8;
    transition: background-color 0.2s ease;
  }
  .item-card:hover {
    background-color: #f1f3f4;
  }
  .item-card a {
    color: #0366d6;
    text-decoration: none;
    font-weight: 500;
    font-size: 1em;
    display: block;
  }
  .item-card a:hover {
    text-decoration: underline;
  }
  .item-id {
    color: #586069;
    font-size: 0.9em;
    font-weight: 400;
  }
  .no-items {
    text-align: center;
    color: #586069;
    padding: 40px;
    font-size: 1em;
  }
`;

// Common JavaScript functions
const commonJavaScript = `
  function showMessage(elementId, text, type, columnId) {
    const el = document.getElementById(elementId + (columnId ? '-' + columnId : ''));
    if (el) {
      el.textContent = text;
      el.className = 'message ' + type;
      el.style.display = 'block';
      setTimeout(() => { el.style.display = 'none'; el.textContent = ''; }, 3000);
    }
  }

  function renderItemDetails(item, boardColumns, itemBoardId, isStandalone = true) {
    const columnsToShow = ['owner', 'tenant', 'text52', 'email', 'text9', 'date70', 'date0', 'weekly_rent', 'date4', 'formula71', 'key_numbers8', 'status61', 'creation_log1', 'status19'];
    const prefix = isStandalone ? '' : 'missive-';

    let html = isStandalone ? 
      '' :
      \`<h1><a href="/item-details/\${item.id}" target="_blank" title="Open full details page">\${item.name || 'Unnamed Item'}</a> (ID: \${item.id})</h1>\`;

    html += \`
      <div class="columns-grid" style="margin-bottom: 20px;">
        <div class="column-label"><strong>Property Name:</strong></div>
        <div class="column-input-value">
          <input type="text" id="\${prefix}item-name-input" value="\${item.name || ''}" />
        </div>
        <div class="column-action">
          <button id="\${prefix}save-item-name-button" class="save-button">Save Name</button>
        </div>
        <div id="\${prefix}message-item-name" class="message column-message" style="display:none;"></div>
      </div>
    \`;

    html += '<h3 class="columns-heading">Column Values:</h3>';
    html += \`<div id="\${prefix}item-columns-container" class="columns-grid">\`;

    if (item.column_values && item.column_values.length > 0) {
      const filteredColumnValues = item.column_values.filter(cv => columnsToShow.includes(cv.id));

      filteredColumnValues.forEach(cv => {
        const columnDefinition = boardColumns.find(bc => bc.id === cv.id);
        const columnTitle = columnDefinition ? columnDefinition.title : ('ID ' + cv.id);
        const columnType = columnDefinition ? columnDefinition.type : cv.type;

        html += '<div class="column-label"><strong>' + columnTitle + ':</strong></div>';
        html += '<div class="column-input-value">';

        let currentValue = cv.text || '';
        if (cv.value) {
          try {
            const parsedValue = JSON.parse(cv.value);
            if (columnType === 'date' && parsedValue.date) {
              currentValue = parsedValue.date;
            } else if (columnType === 'email' && parsedValue.email) {
              currentValue = parsedValue.email;
            }
          } catch (e) { /* ignore */ }
        }

        // Input rendering based on column type
        if (columnType === 'status' && columnDefinition && columnDefinition.settings_str) {
          try {
            const settings = JSON.parse(columnDefinition.settings_str);
            let labels = settings.labels;
            if (Array.isArray(settings.labelsArray)) {
              labels = {};
              settings.labelsArray.forEach(labelObj => { labels[labelObj.id.toString()] = labelObj.name; });
            }
            let currentStatusValueObj = null;
            if (cv.value) { try { currentStatusValueObj = JSON.parse(cv.value); } catch (e) {} }

            let currentStatusSelectedKey = null;
            if(currentStatusValueObj){
              currentStatusSelectedKey = currentStatusValueObj.index !== undefined ? String(currentStatusValueObj.index) : (currentStatusValueObj.id ? String(currentStatusValueObj.id) : null);
            }
            if (!currentStatusSelectedKey && labels) {
              for(const [key, labelName] of Object.entries(labels)){
                if(labelName === cv.text) {
                  currentStatusSelectedKey = key;
                  break;
                }
              }
            }

            html += \`<select class="\${prefix}editable-column-select" data-column-id="\${cv.id}" data-column-type="status">\`;
            html += \`<option value="">-- No Change --</option>\`;
            if (labels) {
              for (const [key, labelName] of Object.entries(labels)) {
                const isSelected = key === currentStatusSelectedKey;
                html += '<option value="' + key + '"' + (isSelected ? ' selected' : '') + '>' + labelName + '</option>';
              }
            } else {
              html += '<option value="">No labels defined</option>';
            }
            html += '</select>';
          } catch (e) {
            console.error("Error parsing status settings for column " + cv.id, e);
            html += '<div class="readonly-text">' + (cv.text || '<em>Error loading status</em>') + '</div>';
          }
        } else if (columnType === 'email') {
          html += \`<input type="email" class="\${prefix}editable-column-input" data-column-id="\${cv.id}" data-column-type="email" value="\${currentValue}">\`;
        } else if (columnType === 'date') {
          html += \`<input type="date" class="\${prefix}editable-column-input" data-column-id="\${cv.id}" data-column-type="date" value="\${currentValue}">\`;
        } else if (['text', 'long-text', 'numbers', 'link'].includes(columnType)) {
          html += \`<input type="text" class="\${prefix}editable-column-input" data-column-id="\${cv.id}" data-column-type="\${columnType}" value="\${cv.text || ''}">\`;
        } else {
          html += '<div class="readonly-text">' + (cv.text || '<em>empty</em>') + '</div>';
        }
        html += '</div>';

        html += '<div class="column-action">';
        if (['status', 'text', 'long-text', 'numbers', 'link', 'email', 'date'].includes(columnType)) {
          html += \`<button class="\${prefix}save-column-button save-button" data-column-id="\${cv.id}" data-column-type="\${columnType}">Save</button>\`;
        }
        html += \`<div id="\${prefix}message-col-\${cv.id}" class="message column-message" style="display:none;"></div></div>\`;
      });
    } else {
      html += '<p style="grid-column: 1 / -1;">No column values.</p>';
    }
    html += '</div>';

    if (!isStandalone) {
      html += '<div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e1e4e8;">';
      html += '<a href="/" class="back-link" style="display: inline-block; padding: 10px 20px; background-color: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; color: #0366d6; text-decoration: none; font-weight: 500;">← Back to Board Items</a>';
      html += '</div>';
    }

    return html;
  }

  function addSaveEventListeners(itemId, boardId, isStandalone = true) {
    const prefix = isStandalone ? '' : 'missive-';

    const saveNameBtn = document.getElementById(prefix + 'save-item-name-button');
    if (saveNameBtn) {
      saveNameBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById(prefix + 'item-name-input');
        const newName = nameInput.value;
        saveNameBtn.disabled = true; saveNameBtn.textContent = 'Saving...';
        try {
          const payload = { boardId: String(boardId), itemName: newName };
          const response = await fetch(\`/api/update-item-details/\${itemId}\`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (response.ok && result.success) {
            showMessage(prefix + 'message-item-name', 'Name updated!', 'success');
          } else {
            throw new Error(result.error || 'Failed to update name.');
          }
        } catch (err) { showMessage(prefix + 'message-item-name', 'Error: ' + err.message, 'error'); }
        saveNameBtn.disabled = false; saveNameBtn.textContent = 'Save Name';
      });
    }

    document.querySelectorAll('.' + prefix + 'save-column-button').forEach(button => {
      button.addEventListener('click', async (event) => {
        const columnId = event.target.dataset.columnId;
        const columnType = event.target.dataset.columnType;
        let inputElement, newValueForApi;

        if (columnType === 'status') {
          inputElement = document.querySelector(\`select.\${prefix}editable-column-select[data-column-id="\${columnId}"]\`);
          const selectedKey = inputElement.value;
          if (!selectedKey) {
            showMessage(prefix + 'message-col', 'No change selected.', 'success', columnId);
            return;
          }
          if (!isNaN(parseInt(selectedKey, 10))) {
            newValueForApi = { "index": parseInt(selectedKey, 10) };
          } else {
            newValueForApi = { "label": String(selectedKey) };
          }
        } else if (columnType === 'email') {
          inputElement = document.querySelector(\`input.\${prefix}editable-column-input[data-column-id="\${columnId}"]\`);
          const emailValue = inputElement.value.trim();
          newValueForApi = { "email": emailValue, "text": emailValue };
        } else if (columnType === 'date') {
          inputElement = document.querySelector(\`input.\${prefix}editable-column-input[data-column-id="\${columnId}"]\`);
          const dateValue = inputElement.value;
          newValueForApi = dateValue ? { "date": dateValue } : {};
        } else {
          inputElement = document.querySelector(\`input.\${prefix}editable-column-input[data-column-id="\${columnId}"]\`);
          newValueForApi = inputElement.value;
        }

        event.target.disabled = true; event.target.textContent = 'Saving...';
        try {
          const columnUpdates = {};
          columnUpdates[columnId] = newValueForApi;
          const payload = { boardId: String(boardId), column_values: columnUpdates };
          const response = await fetch(\`/api/update-item-details/\${itemId}\`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (response.ok && result.success) {
            showMessage(prefix + 'message-col', 'Saved!', 'success', columnId);
          } else {
            throw new Error(result.error || 'Failed to save column.');
          }
        } catch (err) {
          showMessage(prefix + 'message-col', 'Error: ' + err.message, 'error', columnId);
        }
        event.target.disabled = false; event.target.textContent = 'Save';
      });
    });
  }
`;

// Home route - Displays items for the TARGET_BOARD_ID
router.get('/', async (req, res) => {
  const boardId = TARGET_BOARD_ID;
  console.log(`--- Home Route ('/') displaying items for board ID: ${boardId} ---`);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Items for Board ${boardId}</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <h2 id="board-name-display" class="loading">Loading board name...</h2>
        <div class="search-container" style="display: none;">
          <input type="text" id="search-input" placeholder="Search items by name...">
          <div id="search-results"></div>
        </div>
        <div id="items-container" class="loading">Loading items...</div>
      </div>
      <script>
        let allItems = [];
        let filteredItems = [];

        async function fetchBoardItems() {
          const boardId = "${boardId}";
          const itemsContainer = document.getElementById('items-container');
          const boardNameDisplay = document.getElementById('board-name-display');
          const searchContainer = document.querySelector('.search-container');

          try {
            const response = await fetch(\`/api/get-items-for-board/\${boardId}\`);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: "API request failed with status " + response.status }));
              throw new Error(errorData.error || \`API request failed: \${response.status}\`);
            }
            const data = await response.json();

            if (data.boardName && data.boardName !== 'N/A') {
              boardNameDisplay.textContent = 'Board Name: ' + data.boardName;
            } else {
              boardNameDisplay.textContent = 'Board Name: Not found or not provided.';
            }
            boardNameDisplay.classList.remove('loading');

            if (data.error) {
              itemsContainer.innerHTML = '<p class="error">Error fetching items: ' + data.error + '</p>';
            } else if (data.items && data.items.length > 0) {
              allItems = data.items;
              filteredItems = [...allItems];
              renderItems(filteredItems);
              setupSearch();
              searchContainer.style.display = 'block';
            } else {
              itemsContainer.innerHTML = '<p>No items found for this board.</p>';
            }
          } catch (err) {
            console.error('Error in fetchBoardItems:', err);
            boardNameDisplay.textContent = 'Board Name: Error loading';
            boardNameDisplay.classList.remove('loading');
            itemsContainer.innerHTML = '<p class="error">Failed to load items: ' + err.message + '</p>';
          }
          itemsContainer.classList.remove('loading');
        }

        function renderItems(items) {
          const itemsContainer = document.getElementById('items-container');
          if (items.length > 0) {
            let html = '<ul class="items-list">';
            items.forEach(item => {
              html += '<li class="item-card">';
              html += '<a href="/item-details/' + item.id + '">';
              html += (item.name || 'Unnamed Item');
              html += '</a>';
              html += '</li>';
            });
            html += '</ul>';
            itemsContainer.innerHTML = html;
          } else {
            itemsContainer.innerHTML = '<div class="no-items">No items match your search.</div>';
          }
          updateSearchResults(items.length);
        }

        function updateSearchResults(count) {
          const searchResults = document.getElementById('search-results');
          const searchInput = document.getElementById('search-input');
          const searchTerm = searchInput.value.trim();

          if (searchTerm) {
            searchResults.textContent = \`Showing \${count} of \${allItems.length} items matching "\${searchTerm}"\`;
          } else {
            searchResults.textContent = \`Showing all \${allItems.length} items\`;
          }
        }

        function setupSearch() {
          const searchInput = document.getElementById('search-input');

          searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();

            if (searchTerm === '') {
              filteredItems = [...allItems];
            } else {
              filteredItems = allItems.filter(item => {
                const itemName = (item.name || 'Unnamed Item').toLowerCase();
                const itemId = item.id.toString();
                return itemName.includes(searchTerm) || itemId.includes(searchTerm);
              });
            }

            renderItems(filteredItems);
          });

          searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              this.value = '';
              filteredItems = [...allItems];
              renderItems(filteredItems);
            }
          });
        }

        fetchBoardItems();
      </script>
    </body>
    </html>
  `);
});

// Route to display details for a specific item (standalone item view)
router.get('/item-details/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  console.log(`--- Item Details Page Route ('/item-details/${itemId}') ---`);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Details for Item ${itemId}</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <div id="item-content" class="loading">Loading item data...</div>
        <a href="/" class="back-link">← Back to Board Items</a>
      </div>

      <script>
        ${commonJavaScript}

        const currentItemId = "${itemId}";
        const itemContentArea = document.getElementById('item-content');

        async function fetchAndRenderItemDetails() {
          try {
            const response = await fetch(\`/api/get-item-details/\${currentItemId}\`);
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({error: "Failed to load details: " + response.statusText}));
              throw new Error(errorData.error || \`API request failed: \${response.status}\`);
            }
            const data = await response.json();
            itemContentArea.classList.remove('loading');

            if (data.error) {
              itemContentArea.innerHTML = '<p class="error">Error: ' + data.error + '</p>';
            } else if (data.item) {
              const html = renderItemDetails(data.item, data.boardColumns || [], data.item.board.id, true);
              itemContentArea.innerHTML = html;
              addSaveEventListeners(data.item.id, data.item.board.id, true);
            } else {
              itemContentArea.innerHTML = '<p class="error">Item details not found.</p>';
            }
          } catch (err) {
            console.error('Error in fetchAndRenderItemDetails:', err);
            itemContentArea.classList.remove('loading');
            itemContentArea.innerHTML = '<p class="error">Failed to load item details: ' + err.message + '</p>';
          }
        }

        fetchAndRenderItemDetails();
      </script>
    </body>
    </html>`);
});

// Route for Missive Panel - loads based on email
router.get('/missive-panel', (req, res) => {
  const senderEmail = req.query.senderEmail || '';
  console.log(`--- Missive Panel Route ('/missive-panel') for email: ${senderEmail} ---`);

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Monday.com Info: ${senderEmail}</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div id="missive-content-area" class="container loading">
        Loading details for ${senderEmail}...
      </div>

      <script>
        ${commonJavaScript}

        const panelSenderEmail = "${senderEmail}";
        const contentArea = document.getElementById('missive-content-area');

        async function loadItemForMissive() {
          if (!panelSenderEmail) {
            contentArea.innerHTML = '<p class="error-message">No sender email provided.</p>';
            contentArea.classList.remove('loading');
            return;
          }
          contentArea.innerHTML = '<p class="loading">Searching for ' + panelSenderEmail + ' in Monday.com...</p>';

          try {
            const findResponse = await fetch(\`/api/find-item-by-email?email=\${encodeURIComponent(panelSenderEmail)}\`);
            if (!findResponse.ok) {
              const errorData = await findResponse.json().catch(() => ({error: "Failed to search: " + findResponse.statusText}));
              throw new Error(errorData.error || \`Failed to search for item: \${findResponse.status}\`);
            }
            const findData = await findResponse.json();

            if (findData.error || !findData.item || !findData.item.id) {
              contentArea.innerHTML = '<p class="no-match">No matching record found for ' + panelSenderEmail + '. ' + (findData.message || '') + '</p>' +
                '<div style="text-align: center; margin-top: 15px;"><button onclick="window.location.href=\\'/missive.html\\' " style="background-color: #0366d6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Go Back to Email Selection</button></div>';
              contentArea.classList.remove('loading');
              return;
            }

            const foundItemId = findData.item.id;
            contentArea.innerHTML = '<p class="loading">Found item. Loading details for ' + (findData.item.name || 'Item ' + foundItemId) + '...</p>';

            const detailsResponse = await fetch(\`/api/get-item-details/\${foundItemId}\`);
            if (!detailsResponse.ok) {
              const errorData = await detailsResponse.json().catch(() => ({error: "Failed to get details: " + detailsResponse.statusText}));
              throw new Error(errorData.error || \`Failed to fetch item details: \${detailsResponse.status}\`);
            }
            const detailsData = await detailsResponse.json();
            contentArea.classList.remove('loading');

            if (detailsData.error) {
              contentArea.innerHTML = '<p class="error-message">Error loading details for ' + (findData.item.name || 'item') + ': ' + detailsData.error + '</p>';
            } else if (detailsData.item && detailsData.item.board && detailsData.item.board.id) {
              const html = renderItemDetails(detailsData.item, detailsData.boardColumns || [], detailsData.item.board.id, false);
              contentArea.innerHTML = html;
              addSaveEventListeners(detailsData.item.id, detailsData.item.board.id, false);
            } else {
              contentArea.innerHTML = '<p class="error-message">Could not load complete details for ' + (findData.item.name || 'item') + '.</p>';
            }

          } catch (err) {
            console.error("Error in Missive panel load:", err);
            contentArea.classList.remove('loading');
            contentArea.innerHTML = '<p class="error-message">Error: ' + err.message + '</p>';
          }
        }

        loadItemForMissive();
      </script>
    </body>
    </html>
  `);
});

module.exports = router;