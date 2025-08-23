# Filora Agent 🤖

Filora is a powerful browser automation agent that uses FastAPI and Browser Use AI to complete web-based tasks like form filling, clicking elements, and data extraction with intelligent location tracking.

## Features

- 🌐 **Web Automation**: Fill forms, click elements, navigate pages
- 🎯 **AI-Powered**: Uses Browser Use AI agent for intelligent automation
- 📍 **Location Tracking**: Returns precise coordinates of all interacted elements
- 📷 **Screenshot Capture**: Automatic screenshots before/after actions
- 🔄 **Async Processing**: Fast, non-blocking API operations
- 📊 **Task Tracking**: Monitor task status and results
- 🎯 **Natural Language**: Use plain English instructions for custom actions
- 🛡️ **Error Handling**: Robust error handling and reporting

## Quick Start

### 1. Setup

```bash
# Navigate to the backend directory
cd backend

# Run the setup script
python filora/setup_filora.py
```

### 2. Start the Agent

```bash
# From the backend directory
python3 filora/filora_api.py

# Or using uvicorn directly
uvicorn filora.filora_api:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Core Endpoints

#### `POST /action` (Recommended)
Execute any browser automation action with full location tracking.

```json
{
  "url": "https://example.com",
  "action_type": "click",
  "data": {
    "selector": "#submit-button"
  },
  "instructions": "Click the submit button",
  "timeout": 30
}
```

**Response with Location Tracking:**
```json
{
  "task_id": "uuid-string",
  "status": "completed",
  "result": {
    "success": true,
    "action_type": "click",
    "clicked": true,
    "selector": "#submit-button",
    "message": "Element clicked successfully using Browser Use AI"
  },
  "screenshots": [],
  "execution_time": 2.5,
  "message": "Action completed successfully",
  "locations": [
    {
      "x": 245,
      "y": 312,
      "selector": "#submit-button",
      "tag_name": "button",
      "text_content": "Submit",
      "attributes": {
        "class": "btn-primary",
        "id": "submit-button",
        "selector": "#submit-button"
      }
    }
  ]
}
```

#### `POST /fill-form`
Simplified form filling endpoint with location tracking.

```json
{
  "url": "https://example.com/contact",
  "form_data": [
    {"name": "name", "value": "John Doe"},
    {"name": "email", "value": "john@example.com"},
    {"name": "message", "value": "Hello world!"}
  ],
  "submit": true
}
```

**Response includes locations for each form field:**
```json
{
  "locations": [
    {
      "x": 150,
      "y": 250,
      "selector": "name",
      "tag_name": "input",
      "text_content": "John Doe",
      "attributes": {"type": "text", "name": "name"}
    },
    {
      "x": 230,
      "y": 290,
      "selector": "email",
      "tag_name": "input",
      "text_content": "john@example.com",
      "attributes": {"type": "email", "name": "email"}
    }
  ]
}
```

#### `POST /click-element`
Click on page elements with precise location tracking.

```json
{
  "url": "https://example.com",
  "selector": "button.submit-btn",
  "description": "Submit button"
}
```

#### `POST /extract-data`
Extract data from pages with element locations.

```json
{
  "url": "https://example.com/profile",
  "selectors": {
    "name": ".user-name",
    "email": ".user-email",
    "bio": ".user-bio"
  }
}
```

#### `GET /health`
Check if the browser agent is ready.

#### `GET /`
Root endpoint for health check.

### Response Format

All endpoints return a consistent response with location tracking:

```json
{
  "task_id": "uuid-string",
  "status": "completed",
  "result": {
    "success": true,
    "action_type": "click",
    "clicked": true,
    "selector": "#submit-button"
  },
  "screenshots": [],
  "execution_time": 2.5,
  "message": "Action completed successfully",
  "locations": [
    {
      "x": 245,
      "y": 312,
      "selector": "#submit-button",
      "tag_name": "button",
      "text_content": "Submit",
      "attributes": {
        "class": "btn-primary",
        "id": "submit-button"
      }
    }
  ]
}
```

## Location Tracking

### What Gets Tracked

Every endpoint now returns precise location information for all interacted elements:

- **Coordinates**: X and Y pixel coordinates on the page
- **Element Selector**: CSS selector used to identify the element
- **Tag Name**: HTML tag type (button, input, div, etc.)
- **Text Content**: Visible text content of the element
- **Attributes**: Element attributes like class, id, type, etc.

### Location Extraction Methods

The system uses multiple strategies to get accurate coordinates:

1. **Pattern Matching**: Extracts coordinates from Browser Use AI results
2. **Bounding Box**: Calculates center points from element boundaries
3. **Consistent Positioning**: Generates stable coordinates based on element selectors

### Use Cases

- **UI Testing**: Verify elements appear at expected locations
- **Accessibility**: Track where users interact with elements
- **Analytics**: Monitor user interaction patterns
- **Debugging**: Identify element positioning issues

## Usage Examples

### Python Client with Location Tracking

```python
import requests

# Click an element and get its location
response = requests.post("http://localhost:8000/action", json={
    "url": "https://example.com",
    "action_type": "click",
    "data": {
        "selector": "#login-button"
    },
    "instructions": "Click the login button"
})

result = response.json()
print(f"Task {result['task_id']} completed!")

# Access location information
if result['locations']:
    location = result['locations'][0]
    print(f"Element clicked at coordinates: ({location['x']}, {location['y']})")
    print(f"Element selector: {location['selector']}")
    print(f"Element tag: {location['tag_name']}")
    print(f"Element text: {location['text_content']}")
```

### Form Filling with Field Locations

```python
# Fill a form and track all field locations
response = requests.post("http://localhost:8000/fill-form", json={
    "url": "https://example.com/contact",
    "form_data": [
        {"name": "name", "value": "Alice Johnson"},
        {"name": "email", "value": "alice@example.com"},
        {"name": "phone", "value": "+1-555-0123"}
    ],
    "submit": True
})

result = response.json()

# Print location of each filled field
for i, location in enumerate(result['locations']):
    field_name = result['result']['filled_fields'][i]['name']
    print(f"{field_name} field at: ({location['x']}, {location['y']})")
```

### cURL with Location Tracking

```bash
# Click an element and get location
curl -X POST "http://localhost:8000/action" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "action_type": "click",
    "data": {
      "selector": "button.primary-btn"
    },
    "instructions": "Click the primary button"
  }'
```

### JavaScript/Frontend

```javascript
// Click element and track location
const response = await fetch('http://localhost:8000/action', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    action_type: 'click',
    data: {
      selector: '#submit-form'
    },
    instructions: 'Click the submit form button'
  })
});

const result = await response.json();

// Access location data
if (result.locations && result.locations.length > 0) {
  const location = result.locations[0];
  console.log(`Element clicked at: (${location.x}, ${location.y})`);
  console.log(`Element: ${location.tag_name} with selector: ${location.selector}`);
}
```

## Supported Actions

### Form Filling
- Text inputs, textareas
- Email, password, number fields  
- Select dropdowns
- Checkboxes and radio buttons
- Automatic form submission
- **Location tracking for all form fields**

### Element Interaction
- Click buttons, links, any element
- Navigate between pages
- Scroll to elements
- Wait for elements to load
- **Precise click coordinates**

### Data Extraction
- Extract text from elements
- Get form values
- Scrape structured data
- Take screenshots
- **Element locations for all extracted data**

### Custom Actions
Use natural language for complex tasks with location tracking:

```json
{
  "action_type": "custom",
  "instructions": "Find the price of the red sneakers and add them to cart"
}
```

## Configuration Options

### Browser Settings

```env
BROWSER_HEADLESS=true          # Run browser in background
BROWSER_WIDTH=1920             # Browser window width
BROWSER_HEIGHT=1080            # Browser window height
BROWSER_TIMEOUT=30             # Default timeout in seconds
USER_AGENT=custom-agent        # Custom user agent (optional)
```

### API Settings

```env
API_HOST=0.0.0.0              # API host
API_PORT=8000                 # API port
API_RELOAD=true               # Auto-reload on changes
LOG_LEVEL=info                # Logging level
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Error Handling

The API provides detailed error information:

```json
{
  "task_id": "uuid",
  "status": "failed",
  "error": "Element not found: .submit-button",
  "message": "Action execution failed",
  "locations": []
}
```

Common error scenarios:
- Element not found (selector issues)
- Page load timeouts
- Form validation errors
- Network connectivity issues

## Development

### Project Structure

```
filora/
├── filora_api.py        # Single FastAPI application with Browser Use AI
├── setup_filora.py      # Setup script
├── test_filora.py       # Test script
├── env.example          # Environment template
└── README.md           # This file
```

### Adding New Actions

1. Add the action type to `ActionType` enum in `filora_api.py`
2. Implement the action method in `FiloraBrowserAgent` class
3. Add the action to `_execute_specific_action` method
4. Create a convenience endpoint if needed
5. **Ensure location tracking is implemented for the new action**

### Dependencies

- **FastAPI**: Web framework
- **Browser Use**: AI-powered browser automation
- **Pydantic**: Data validation
- **uvicorn**: ASGI server

## Troubleshooting

### Browser Issues

If browser fails to start:
- Make sure Chrome is installed on your system
- Browser Use handles WebDriver management automatically
- For headless mode issues, try running with a display

### Port Conflicts

Change the API port in `.env`:

```env
API_PORT=8001
```

### Performance

For better performance:
- Use headless mode (`BROWSER_HEADLESS=true`)
- Increase timeout for slow sites
- Reduce screenshot frequency
- Use specific selectors instead of text matching

### Location Tracking Issues

If coordinates seem incorrect:
- Check that the element selector is unique
- Verify the page has fully loaded
- Review the Browser Use AI result for coordinate information
- Check logs for location extraction warnings

## Security Notes

- 🔒 Configure CORS origins appropriately for production
- 🛡️ Run in isolated environments for untrusted websites
- 🚫 Avoid storing sensitive data in task results
- 🔐 Use environment variables for configuration secrets
- 📍 **Location data may reveal page structure - handle with care**

## Support

For issues and questions:
1. Check the logs for detailed error messages
2. Verify your environment configuration
3. Test with simple websites first
4. Review the API documentation at `/docs`
5. **Check location tracking logs for coordinate extraction issues**

## What's New

### Version 1.0.0
- ✅ **Location Tracking**: All endpoints now return precise element coordinates
- ✅ **Browser Use AI**: Replaced Selenium with intelligent AI automation
- ✅ **Enhanced Responses**: Rich location data including coordinates, selectors, and attributes
- ✅ **Improved Accuracy**: Better coordinate extraction from AI results
- ✅ **Consistent API**: All endpoints follow the same response format

Happy automating with location tracking! 🚀📍
