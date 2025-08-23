# Filora Agent 🤖

Filora is a simple browser automation agent that uses FastAPI and Selenium to complete web-based tasks like form filling, clicking elements, and data extraction.

## Features

- 🌐 **Web Automation**: Fill forms, click elements, navigate pages
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

#### `POST /action`
Execute any browser automation action.

```json
{
  "url": "https://example.com",
  "action_type": "fill_form",
  "data": {
    "form_fields": [
      {"name": "email", "value": "user@example.com"},
      {"name": "password", "value": "secret123"}
    ],
    "submit": true
  },
  "instructions": "Fill out the login form and submit it"
}
```

#### `POST /fill-form`
Simplified form filling endpoint.

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

#### `POST /click-element`
Click on page elements.

```json
{
  "url": "https://example.com",
  "selector": "button.submit-btn",
  "description": "Submit button"
}
```

#### `POST /extract-data`
Extract data from pages.

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

#### `GET /tasks/{task_id}`
Get task status and results.

### Response Format

All endpoints return a consistent response:

```json
{
  "task_id": "uuid-string",
  "status": "completed",
  "result": {
    "filled_fields": [...],
    "submitted": true
  },
  "screenshots": ["base64-encoded-image"],
  "execution_time": 2.5,
  "message": "Action completed successfully"
}
```

## Usage Examples

### Python Client

```python
import requests

# Fill a contact form
response = requests.post("http://localhost:8000/fill-form", json={
    "url": "https://example.com/contact",
    "form_data": [
        {"name": "name", "value": "Alice Johnson"},
        {"name": "email", "value": "alice@example.com"},
        {"name": "phone", "value": "+1-555-0123"},
        {"name": "message", "value": "I'm interested in your services."}
    ],
    "submit": True
})

result = response.json()
print(f"Task {result['task_id']} completed!")
print(f"Status: {result['status']}")
```

### cURL

```bash
# Fill a form
curl -X POST "http://localhost:8000/fill-form" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/signup",
    "form_data": [
      {"name": "username", "value": "newuser"},
      {"name": "email", "value": "newuser@example.com"},
      {"name": "password", "value": "securepass123"}
    ],
    "submit": true
  }'
```

### JavaScript/Frontend

```javascript
// Fill a form using fetch
const response = await fetch('http://localhost:8000/fill-form', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/registration',
    form_data: [
      { name: 'firstName', value: 'John' },
      { name: 'lastName', value: 'Doe' },
      { name: 'email', value: 'john.doe@example.com' }
    ],
    submit: true
  })
});

const result = await response.json();
console.log('Form filled successfully:', result);
```

## Supported Actions

### Form Filling
- Text inputs, textareas
- Email, password, number fields  
- Select dropdowns
- Checkboxes and radio buttons
- Automatic form submission

### Element Interaction
- Click buttons, links, any element
- Navigate between pages
- Scroll to elements
- Wait for elements to load

### Data Extraction
- Extract text from elements
- Get form values
- Scrape structured data
- Take screenshots

### Custom Actions
Use natural language for complex tasks:

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
  "message": "Action execution failed"
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
├── filora_api.py        # Single FastAPI application file with all logic
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

### Dependencies

- **FastAPI**: Web framework
- **Selenium**: Browser automation library
- **webdriver-manager**: Automatic WebDriver management
- **Pydantic**: Data validation
- **uvicorn**: ASGI server

## Troubleshooting

### Browser Issues

If browser fails to start:
- Make sure Chrome is installed on your system
- webdriver-manager will automatically download ChromeDriver
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

## Security Notes

- 🔒 Configure CORS origins appropriately for production
- 🛡️ Run in isolated environments for untrusted websites
- 🚫 Avoid storing sensitive data in task results
- 🔐 Use environment variables for configuration secrets

## Support

For issues and questions:
1. Check the logs for detailed error messages
2. Verify your environment configuration
3. Test with simple websites first
4. Review the API documentation at `/docs`

Happy automating! 🚀
