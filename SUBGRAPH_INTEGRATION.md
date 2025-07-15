# Subgraph Integration Guide

This document explains how the subgraph integration works in the social media backend.

## Overview

The `getPosts` method has been enhanced to fetch data from a subgraph and automatically update MongoDB posts when:
- A post exists in MongoDB with a matching `postId` 
- But the `postAddress` field is not yet assigned (null/empty)

## Configuration

Add the following environment variables to your `.env` file:

```env
# Subgraph Configuration
SUBGRAPH_URL=https://api.studio.thegraph.com/query/your-subgraph-id/your-subgraph-name/version/latest
SUBGRAPH_AUTH_TOKEN=your-graph-auth-token-here
```

### Getting Your Subgraph URL and Token

1. **Subgraph URL**: 
   - For Subgraph Studio: `https://api.studio.thegraph.com/query/[subgraph-id]/[subgraph-name]/version/[version]`
   - For Hosted Service: `https://api.thegraph.com/subgraphs/name/[username]/[subgraph-name]`

2. **Auth Token**: 
   - Get your API key from [The Graph Studio](https://thegraph.com/studio/)
   - Navigate to your subgraph and copy the API key

## How It Works

1. **Fetch Posts**: The `getPosts` method first retrieves posts from MongoDB as usual
2. **Subgraph Query**: Simultaneously fetches post data from the configured subgraph
3. **Match & Update**: For each MongoDB post without an `address`:
   - Searches for matching post in subgraph data (by `id` field)
   - If found, updates the MongoDB post with the `postAddress` from subgraph
   - Updates the response data to include the new address

## GraphQL Query

The current subgraph query being used:

```graphql
{
  posts {
    id
    postAddress
  }
}
```

## Error Handling

- If subgraph is not configured (missing env vars), integration is skipped
- If subgraph query fails, original MongoDB posts are returned without modification
- Individual post update failures are logged but don't break the overall response
- All errors are logged to console for debugging

## API Response

The API continues to work exactly as before, but posts may now include the `address` field populated from subgraph data.

Example response:
```json
{
  "success": true,
  "items": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "address": "0x1234567890abcdef...", // ← This may be populated from subgraph
      "message": "Hello world!",
      "owner": { ... },
      // ... other post fields
    }
  ]
}
```

## Testing

To test the integration:

1. Ensure you have posts in MongoDB without `address` field
2. Configure your `.env` with valid subgraph URL and token
3. Make sure your subgraph has posts with matching `id` fields
4. Call the `GET /posts` endpoint
5. Check the response for populated `address` fields
6. Verify MongoDB documents are updated

## Troubleshooting

- **"Subgraph service not configured"**: Check your `.env` file has both `SUBGRAPH_URL` and `SUBGRAPH_AUTH_TOKEN`
- **"Error fetching data from subgraph"**: Verify your subgraph URL and auth token are correct
- **Posts not updating**: Ensure the subgraph `id` field matches MongoDB `_id` values

## Performance Considerations

- Subgraph queries run in parallel with MongoDB queries when possible
- Post updates are batched using `Promise.all()`
- Failed updates don't block the response
- Consider implementing caching for frequently accessed subgraph data
