async function fetchFromMonday(query, variables = {}) {
  console.log('--- fetchFromMonday ---');

  const payload = { query };
  if (Object.keys(variables).length > 0) {
    payload.variables = variables;
  }

  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_KEY,
        'API-Version': '2023-10'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      let errorDetail = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorDetail = errorJson.errors.map(e => e.message).join('; ');
        } else if (errorJson.error_message) {
          errorDetail = errorJson.error_message;
        }
      } catch (e) {
        // Not JSON, use raw text
      }
      throw new Error(`Monday API Error: Status ${response.status} - ${errorDetail}`);
    }

    const data = JSON.parse(responseText);
    if (data.errors) {
      console.error('Monday.com GraphQL Errors:', data.errors);
      let errorMessage = data.errors.map(e => e.message).join('; ');
      if (data.errors[0] && data.errors[0].locations) {
        errorMessage += ` (Location: ${JSON.stringify(data.errors[0].locations[0])})`;
      }
      throw new Error(errorMessage);
    }

    if (!data.data) {
        console.warn('Monday.com response missing data field:', data);
    }

    return data;
  } catch (error) {
    console.error('Error in fetchFromMonday:', error.message);
    throw error;
  }
}

const updateNameMutation = `
        mutation ($itemId: ID!, $boardId: ID!, $itemName: String!) {
          change_name_column_value(item_id: $itemId, board_id: $boardId, value: $itemName) {
            id
            name
          }
        }
      `;

module.exports = { fetchFromMonday };