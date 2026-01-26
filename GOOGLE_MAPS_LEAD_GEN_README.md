# Google Maps Lead Generation n8n Workflows

Three workflow versions for scraping business leads from Google Maps using Apify.

## Workflow Files

| File | Description |
|------|-------------|
| `google-maps-lead-generation-simple.json` | Basic workflow - Form trigger, scrape, filter, output |
| `google-maps-lead-generation-workflow.json` | Standard workflow - Includes AnyMailFinder email enrichment |
| `google-maps-lead-generation-full.json` | Full pipeline - Email finding, website scraping, AI icebreaker, Google Sheets |

## Setup Requirements

### 1. Apify Account & API Key
- Create account at [apify.com](https://apify.com)
- Get API token from Settings > Integrations
- In n8n: Create **HTTP Query Auth** credential
  - Name: `token`
  - Value: `your_apify_api_token`

### 2. AnyMailFinder (Optional - for email enrichment)
- Create account at [anymailfinder.com](https://anymailfinder.com)
- Get API key from dashboard
- In n8n: Create **HTTP Header Auth** credential
  - Name: `Authorization`
  - Value: `Bearer your_anymailfinder_api_key`

### 3. Google Sheets (Optional - for full workflow)
- Create OAuth2 credentials in n8n
- Create a Google Sheet with these columns:
  ```
  Business Name | Category | Full Address | City | State | Zipcode | Phone | Website | Email | Rating | Review Count | Google Maps URL | Icebreaker | Scraped At
  ```

### 4. OpenAI (Optional - for AI icebreaker)
- Get API key from [platform.openai.com](https://platform.openai.com)
- Create OpenAI credential in n8n

## How to Import

1. Open n8n
2. Click the three dots menu (...)
3. Select **Import from File**
4. Choose the JSON file you want to use
5. Update credential IDs in each node

## Form Fields

The form trigger collects:
- **Business Type** - What to search (e.g., "plumbers", "dentists")
- **City** - Location city
- **State** - State abbreviation
- **Zipcode** - Optional for precise targeting
- **Radius** - Search radius in miles/km
- **Max Results** - Number of leads to scrape
- **Minimum Rating** - Filter by Google rating (full version)
- **Find Emails** - Toggle email enrichment (full version)

## Data Extracted

For each business:
- Business Name
- Category
- Full Address (street, city, state, zip)
- Phone Number
- Website URL
- Google Rating
- Review Count
- Google Maps URL
- Place ID (unique identifier)
- Email (if enrichment enabled)
- AI Icebreaker (full version)

## Apify Actor Used

**compass/crawler-google-places** - The official Google Maps Scraper
- Docs: https://apify.com/compass/crawler-google-places
- Supports search queries, location filtering, rating filters
- Returns structured JSON data

## API Endpoints

```
POST https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=YOUR_TOKEN
```

Request body:
```json
{
  "searchStringsArray": ["plumbers in Austin, TX"],
  "maxCrawledPlacesPerSearch": 50,
  "language": "en",
  "skipClosedPlaces": true
}
```

## Notes

- Apify charges based on compute units used
- AnyMailFinder charges per email lookup
- Rate limits are built into the workflow (2s delay between API calls)
- The synchronous endpoint waits for results (timeout set to 5-10 minutes)
