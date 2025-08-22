// routes/api-routes.js
const express = require('express');
const router = express.Router();
const { fetchFromMonday } = require('../utils/monday-api');
const TARGET_BOARD_ID = "273895529"; // Your target board ID
const TENANT_EMAIL_COLUMN_ID = "email"; // The Column ID for "Tenant Email" on your board

// Cache for board items - expires after 5 minutes
const boardCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API endpoint to fetch ALL items for a specific board using Board.items_page with pagination
router.get('/get-items-for-board/:boardId', async (req, res) => {
  const boardId = req.params.boardId;
  console.log(`--- API Endpoint ('/api/get-items-for-board/${boardId}') ---`);

  // Check cache first
  const cacheKey = `board_${boardId}`;
  const cached = boardCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`Serving cached data for board ${boardId} (${cached.items.length} items)`);
    return res.json(cached.data);
  }

  const allItems = [];
  let cursor = null;
  let boardName = 'N/A';
  const limitPerPage = 25; // Adjust as needed, mindful of complexity limits

  try {
    do {
      const itemsQuery = `
        query GetBoardItems($boardIdArray: [ID!]!, $cursor: String) {
          boards(ids: $boardIdArray) {
            name
            items_page(limit: ${limitPerPage}, cursor: $cursor) {
              cursor
              items {
                id
                name
              }
            }
          }
        }
      `;
      const variables = { boardIdArray: [String(boardId)] };
      if (cursor) {
        variables.cursor = cursor;
      }
      const response = await fetchFromMonday(itemsQuery, variables); // Get full response
      const data = response.data; // Extract data part

      if (data && data.boards && data.boards.length > 0) {
        const boardData = data.boards[0];
        if (boardData.name && boardName === 'N/A') boardName = boardData.name;

        if (boardData.items_page && boardData.items_page.items) {
          allItems.push(...boardData.items_page.items);
          cursor = boardData.items_page.cursor;
        } else {
          cursor = null;
        }
      } else {
        console.warn("Board not found or no data when querying for items. Response:", response);
        return res.json({ items: [], boardName: 'N/A', error: (response.errors ? response.errors[0].message : "Board not found or no data returned.") });
      }
    } while (cursor);

    console.log(`Total items fetched for board ${boardId}: ${allItems.length}`);
    
    // Cache the results
    const responseData = { items: allItems, boardName: boardName };
    boardCache.set(cacheKey, {
      data: responseData,
      items: allItems,
      timestamp: Date.now()
    });
    
    res.json(responseData);

  } catch (error) {
    console.error(`Error in /api/get-items-for-board for board ID ${boardId}:`, error.message);
    res.status(500).json({ items: [], boardName: boardName, error: `Server error while fetching items for board ${boardId}: ${error.message}` });
  }
});

// API endpoint to fetch details for a specific item AND its board's columns
router.get('/get-item-details/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  console.log(`--- API Endpoint ('/api/get-item-details/${itemId}') ---`);

  const itemDetailsQuery = `
    query GetItemDetailsById($itemIdArray: [ID!]!) {
      items(ids: $itemIdArray) {
        id
        name
        board {
          id
          columns { # Fetch columns along with the item to ensure context
            id
            title
            type
            settings_str
          }
        }
        column_values {
          id
          text
          type
          value
        }
      }
    }
  `;
  try {
    const response = await fetchFromMonday(itemDetailsQuery, { itemIdArray: [String(itemId)] });
    const itemDataResponse = response.data;

    if (!itemDataResponse || !itemDataResponse.items || itemDataResponse.items.length === 0) {
      return res.status(404).json({ error: `Item with ID ${itemId} not found. Response: ${JSON.stringify(response.errors || response)}` });
    }
    const item = itemDataResponse.items[0];
    const boardColumns = item.board && item.board.columns ? item.board.columns : [];

    res.json({ item: item, boardColumns: boardColumns });

  } catch (error) {
    console.error(`Error in /api/get-item-details for item ID ${itemId}:`, error.message);
    res.status(500).json({ error: `Server error while fetching details for item ${itemId}: ${error.message}` });
  }
});

// API endpoint to update an item's details (name and column values)
router.post('/update-item-details/:itemId', async (req, res) => {
  const itemId = req.params.itemId;
  const { boardId, itemName, column_values: updatedColumnValues } = req.body;

  if (!boardId) {
    return res.status(400).json({ error: 'Missing boardId in request body.' });
  }

  console.log(`--- API Endpoint ('/api/update-item-details/${itemId}') ---`);
  console.log(`Updating item ${itemId} on board ${boardId}. New Name: "${itemName}". Column Updates:`, updatedColumnValues);

  // Monday API expects column_values as a JSON string.
  // If itemName is being updated, it's handled by change_multiple_column_values if 'name' is a key in column_values,
  // or it needs a separate mutation change_item_name.
  // For simplicity, Monday's change_multiple_column_values does NOT update the item's name directly via the column_values JSON.
  // It needs a separate mutation or a different approach if name is part of the same call.
  // The `create_labels_if_missing: true` is for specific column types like dropdown/status.

  // Let's separate name update from column updates for clarity.
  try {
    let itemUpdated = false;
    let lastUpdateData = null;

    // 1. Update item name if provided
    if (itemName !== undefined && itemName !== null) {
      const updateNameMutation = `
        mutation ($itemId: ID!, $boardId: ID!, $itemName: String!) {
          change_simple_column_value(item_id: $itemId, board_id: $boardId, column_id: "name", value: $itemName) {
            id
            name
          }
        }
      `;
      const nameUpdateVars = {
        itemId: String(itemId),
        boardId: String(boardId),
        itemName: itemName
      };
      const nameUpdateResponse = await fetchFromMonday(updateNameMutation, nameUpdateVars);
      if (nameUpdateResponse.data && nameUpdateResponse.data.change_simple_column_value) {
        console.log("Item name updated successfully.");
        itemUpdated = true;
        lastUpdateData = nameUpdateResponse.data.change_simple_column_value;
      } else {
        console.warn('Name update mutation ran, but response structure was not as expected.', nameUpdateResponse);
        // Potentially throw an error or return a specific message
      }
    }

    // 2. Update column values if provided
    if (updatedColumnValues && Object.keys(updatedColumnValues).length > 0) {
      const columnValuesJson = JSON.stringify(updatedColumnValues);
      const updateColumnsMutation = `
        mutation ($itemId: ID!, $boardId: ID!, $columnValuesJson: JSON!) {
          change_multiple_column_values(
            item_id: $itemId,
            board_id: $boardId,
            column_values: $columnValuesJson,
            create_labels_if_missing: true
          ) {
            id
            name # Name might not reflect immediate change from previous mutation in same response
          }
        }
      `;
      const columnUpdateVars = {
        itemId: parseInt(itemId, 10),
        boardId: parseInt(boardId, 10),
        columnValuesJson: columnValuesJson
      };
      const columnUpdateResponse = await fetchFromMonday(updateColumnsMutation, columnUpdateVars);
      if (columnUpdateResponse.data && columnUpdateResponse.data.change_multiple_column_values) {
        console.log("Column values updated successfully.");
        itemUpdated = true;
        lastUpdateData = columnUpdateResponse.data.change_multiple_column_values;
      } else {
         console.warn('Column update mutation ran, but response structure was not as expected.', columnUpdateResponse);
         // Potentially throw an error
      }
    }

    if (itemUpdated) {
      res.json({ success: true, message: 'Item details updated successfully.', updatedItem: lastUpdateData });
    } else if ((itemName === undefined || itemName === null) && (!updatedColumnValues || Object.keys(updatedColumnValues).length === 0)) {
      res.json({ success: true, message: 'No changes were requested.' });
    }
     else {
      // This case means updates were attempted but didn't confirm success from Monday.com
      res.status(500).json({ error: 'Update sent, but confirmation from Monday.com was missing or indicated an issue.', details: lastUpdateData });
    }

  } catch (error) {
    console.error(`Error updating details for item ID ${itemId}:`, error.message, error.stack);
    res.status(500).json({ error: `Server error while updating item details: ${error.message}` });
  }
});


// API endpoint to find an item by email
router.get('/find-item-by-email', async (req, res) => {
    const emailToFind = req.query.email ? req.query.email.toLowerCase().trim() : null;
    if (!emailToFind) {
        return res.status(400).json({ error: "Email query parameter is required." });
    }
    console.log(`--- API Endpoint ('/api/find-item-by-email') --- Email: ${emailToFind}, Board: ${TARGET_BOARD_ID}, Column: ${TENANT_EMAIL_COLUMN_ID}`);

    const allItemsFromBoard = [];
    let cursor = null;
    const limitPerPage = 50; // Fetch 50 items per page

    try {
        console.log("Starting to fetch all items from board for email search...");
        do {
            const itemsFetchQuery = `
              query GetBoardItemsWithEmailColumn($boardIdArray: [ID!]!, $cursor: String, $columnId: [String!]) {
                boards(ids: $boardIdArray) {
                  items_page(limit: ${limitPerPage}, cursor: $cursor, query_params: { rules: [{column_id: $columnId, compare_value: [$emailToCompare], operator: any_of}]}) { # Basic filtering attempt if column allows
                    cursor
                    items {
                      id
                      name
                      column_values(ids: $columnId) {
                        id
                        text
                        value
                        type
                      }
                    }
                  }
                }
              }
            `;
            // Note: query_params on items_page is for more advanced filtering and might not work for all column types with 'any_of' for free text email.
            // A more robust way is to fetch and then filter, or use items_by_column_values if suitable.
            // For now, sticking to fetch and client-side filter as it's more universally reliable for various email column setups.
            // The query_params example above is illustrative and might need adjustment or removal if not effective.
            // Let's use a simpler query that fetches all items and we filter, as per original reliable design.
             const robustItemsFetchQuery = `
              query GetBoardItemsWithEmail($boardIdArray: [ID!]!, $cursor: String, $tenantEmailColId: [String!]) {
                boards(ids: $boardIdArray) {
                  items_page(limit: ${limitPerPage}, cursor: $cursor) {
                    cursor
                    items {
                      id
                      name
                      column_values(ids: $tenantEmailColId) {
                        id
                        text
                        value
                        type
                      }
                    }
                  }
                }
              }
            `;

            const variables = {
                boardIdArray: [String(TARGET_BOARD_ID)],
                tenantEmailColId: [TENANT_EMAIL_COLUMN_ID]
                // emailToCompare: emailToFind // Only if using query_params effectively
            };
            if (cursor) {
                variables.cursor = cursor;
            }
            const response = await fetchFromMonday(robustItemsFetchQuery, variables);
            const data = response.data;

            if (data && data.boards && data.boards.length > 0 && data.boards[0].items_page && data.boards[0].items_page.items) {
                allItemsFromBoard.push(...data.boards[0].items_page.items);
                cursor = data.boards[0].items_page.cursor;
            } else {
                cursor = null;
                 if (response.errors) {
                    console.warn("GraphQL errors while fetching items for email search:", response.errors);
                 }
            }
        } while (cursor);

        console.log(`Total items fetched for email search: ${allItemsFromBoard.length}. Now searching for: "${emailToFind}"`);

        let foundItem = null;
        for (const item of allItemsFromBoard) {
            // console.log(`Checking item ID: ${item.id}, Name: "${item.name}" for email: "${emailToFind}"`); // Verbose
            if (item.column_values && item.column_values.length > 0) {
                const emailColumn = item.column_values.find(cv => cv.id === TENANT_EMAIL_COLUMN_ID);
                if (emailColumn) {
                    let columnEmailText = emailColumn.text ? emailColumn.text.toLowerCase().trim() : null;
                    let columnEmailFromValue = null;

                    if (emailColumn.value) {
                        try {
                            const parsedValue = JSON.parse(emailColumn.value);
                            if (parsedValue && parsedValue.email && (emailColumn.type === 'email' || emailColumn.type === 'integration')) { // Handle integration column too
                                columnEmailFromValue = parsedValue.email.toLowerCase().trim();
                            } else if (typeof parsedValue === 'string') { // Fallback for simple text values in 'value'
                                columnEmailFromValue = parsedValue.toLowerCase().trim();
                            }
                        } catch(e) { /* ignore parsing error if value is not JSON, text field will be primary */ }
                    }

                    // console.log(`  Item ID ${item.id} - Column ${TENANT_EMAIL_COLUMN_ID} (Type: ${emailColumn.type}) - Text: "${columnEmailText}", Parsed Value Email: "${columnEmailFromValue}"`); // Verbose

                    if (columnEmailText === emailToFind || columnEmailFromValue === emailToFind) {
                        foundItem = { id: item.id, name: item.name };
                        console.log(`  MATCH FOUND for "${emailToFind}" in item ID ${item.id}.`);
                        break;
                    }
                }
            }
        }

        if (foundItem) {
            res.json({ item: foundItem });
        } else {
            console.log(`No item ultimately found for email: "${emailToFind}" after checking ${allItemsFromBoard.length} items.`);
            res.json({ item: null, message: `No item found for ${emailToFind}.` });
        }

    } catch (error) {
        console.error(`Error in /api/find-item-by-email for email ${emailToFind}:`, error.message, error.stack);
        res.status(500).json({ error: `Server error while searching for item by email: ${error.message}` });
    }
});

module.exports = router;