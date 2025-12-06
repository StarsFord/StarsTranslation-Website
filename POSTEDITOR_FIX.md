# PostEditor Fixes

## Changes needed in `src/pages/PostEditor.tsx`:

### 1. Fix fetchPost to use correct API route (line ~79)

Change:
```typescript
const response = await api.get(`/api/posts/${id}`);
```

To:
```typescript
const response = await api.get(`/api/posts/id/${id}`);
```

### 2. Load external_links when editing (add after line ~63 where formData is set)

Add:
```typescript
if (post.external_links && post.external_links.length > 0) {
  setExternalLinks(post.external_links);
} else {
  setExternalLinks([{ label: '', url: '' }]);
}
```

### 3. Save external_links when creating/updating post (in handleSubmit, around line ~107-108)

Change:
```typescript
const response = await api.post('/api/posts', formData);
```

To:
```typescript
const response = await api.post('/api/posts', {
  ...formData,
  external_links: externalLinks
});
```

And change (around line ~104):
```typescript
await api.put(`/api/posts/${id}`, formData);
```

To:
```typescript
await api.put(`/api/posts/${id}`, {
  ...formData,
  external_links: externalLinks
});
```

## Summary:
These changes will:
1. Fix the "Failed to load post" error when editing
2. Load existing external links when editing a post
3. Save external links when creating/updating posts
