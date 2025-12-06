# Final Fixes - External Links & Edit Post

## ✅ Backend - COMPLETED
- Added `/id/:id` route for fetching post by ID
- Updated POST and PUT routes to save `external_links`
- Added parsing of `external_links` when fetching posts

## 🔧 Frontend Changes Needed:

### 1. PostEditor.tsx - Fix Edit & Save External Links

#### A. Fix fetchPost (line ~79):
```typescript
// Change from:
const response = await api.get(`/api/posts/${id}`);

// To:
const response = await api.get(`/api/posts/id/${id}`);
```

#### B. Load external_links when editing (add after setting formData, around line ~63):
```typescript
setFormData({
  title: post.title,
  slug: post.slug,
  description: post.description || '',
  content: post.content || '',
  category_id: post.category_id,
  is_translated: post.is_translated,
  thumbnail_url: post.thumbnail_url || ''
});

// ADD THIS:
if (post.external_links && post.external_links.length > 0) {
  setExternalLinks(post.external_links);
}
```

#### C. Save external_links when creating (around line ~107):
```typescript
// Change from:
const response = await api.post('/api/posts', formData);

// To:
const response = await api.post('/api/posts', {
  ...formData,
  external_links: externalLinks
});
```

#### D. Save external_links when updating (around line ~104):
```typescript
// Change from:
await api.put(`/api/posts/${id}`, formData);

// To:
await api.put(`/api/posts/${id}`, {
  ...formData,
  external_links: externalLinks
});
```

### 2. PostDetail.tsx - Display External Links

Add this section AFTER the "Downloads - Original" section (after line ~233):

```tsx
{/* External Download Links */}
{post.external_links && post.external_links.length > 0 && (
  <div className="post-section external-links-section">
    <h2>Alternative Download Links</h2>
    <div className="external-links-list">
      {post.external_links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="external-link-button"
        >
          <span className="link-icon">🔗</span>
          <span className="link-label">{link.label}</span>
          <span className="link-arrow">→</span>
        </a>
      ))}
    </div>
  </div>
)}
```

### 3. PostDetail.css - Style External Links

Add to the end of `PostDetail.css`:

```css
.external-links-section {
  margin-top: 2rem;
}

.external-links-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.external-link-button {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-decoration: none;
  color: #fff;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.external-link-button:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.link-icon {
  font-size: 1.5rem;
}

.link-label {
  flex: 1;
}

.link-arrow {
  font-size: 1.2rem;
}
```

### 4. PostEditor.css - Style External Links Form

Add to `PostEditor.css`:

```css
.external-link-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.btn-danger {
  background: #e94560;
}

.btn-danger:hover {
  background: #c93850;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.section-description {
  color: #aaa;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}
```

## 🗄️ Database Migration

Run this to add the external_links column (if not already done):

```bash
tsx scripts/add-external-links-column.ts
```

## ✅ Testing Checklist:

1. [ ] Create a new post with external links
2. [ ] Edit an existing post and verify data loads
3. [ ] Update external links in an existing post
4. [ ] View post and see external links displayed
5. [ ] Click external links and verify they open correctly

## Summary:

These changes will:
- ✅ Fix "Failed to load post" when editing
- ✅ Load external links when editing posts
- ✅ Save external links to database
- ✅ Display external links beautifully on post detail page
