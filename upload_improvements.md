# Upload Improvements - Implementation Guide

## ✅ Completed:

1. Increased upload limit to 5GB (5368709120 bytes) in `.env`

2. Updated Express body parser limits to 50MB

3. Created `UploadProgress` component for visual feedback

## 🔧 To Implement:

### 1. Add Upload Progress to PostEditor.tsx

Add after line 34 (after versionData state):

```typescript
const [uploadProgress, setUploadProgress] = useState({
  current: 0,

  total: 0,

  fileName: "",

  percentage: 0,
});
```

### 2. Add External Links State

Add after uploadProgress state:

```typescript
const [externalLinks, setExternalLinks] = useState([{ label: "", url: "" }]);

const handleAddLink = () => {
  setExternalLinks([...externalLinks, { label: "", url: "" }]);
};

const handleLinkChange = (index, field, value) => {
  const newLinks = [...externalLinks];

  newLinks[index][field] = value;

  setExternalLinks(newLinks);
};

const handleRemoveLink = (index) => {
  setExternalLinks(externalLinks.filter((_, i) => i !== index));
};
```

### 3. Update uploadFile function (around line 117)

Replace the uploadFile function with:

```typescript
const uploadFile = async (file, attachmentType, index, total) => {
  const formData = new FormData();

  formData.append("file", file);

  formData.append("post_id", postId);

  formData.append("attachment_type", attachmentType);

  setUploadProgress({
    current: index + 1,

    total,

    fileName: file.name,

    percentage: Math.round(((index + 1) / total) * 100),
  });

  await api.post("/api/upload/attachment", formData, {
    headers: { "Content-Type": "multipart/form-data" },

    onUploadProgress: (progressEvent) => {
      const fileProgress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );

      const totalProgress = Math.round(
        ((index + fileProgress / 100) / total) * 100
      );

      setUploadProgress((prev) => ({
        ...prev,

        percentage: totalProgress,
      }));
    },
  });
};
```

### 4. Update file upload loop (around line 128)

Replace with:

```typescript
// Calculate total files

const allFiles = [...files.translated, ...files.original, ...files.images];

const totalFiles = allFiles.length;

let currentIndex = 0;

// Upload translated files

for (const file of files.translated) {
  await uploadFile(file, "translated", currentIndex++, totalFiles);
}

// Upload original files

for (const file of files.original) {
  await uploadFile(file, "original", currentIndex++, totalFiles);
}

// Upload images

for (const file of files.images) {
  await uploadFile(file, "image", currentIndex++, totalFiles);
}

// Reset progress

setUploadProgress({ current: 0, total: 0, fileName: "", percentage: 0 });
```

### 5. Add UploadProgress component to render

Add at the top of the return statement (before the main div):

```tsx
import UploadProgress from "../components/UploadProgress";

// In the return:

{
  uploadProgress.total > 0 && (
    <UploadProgress
      current={uploadProgress.current}
      total={uploadProgress.total}
      fileName={uploadProgress.fileName}
      percentage={uploadProgress.percentage}
    />
  );
}
```

### 6. Add External Links section in the form

Add before the "File Uploads" section (around line 280):

```tsx
<div className="form-section">
  <h2>External Download Links</h2>

  <p className="section-description">
    Add alternative download links (Pixeldrain, Gofile, etc.) as backup options
  </p>

  {externalLinks.map((link, index) => (
    <div key={index} className="external-link-row">
      <div className="form-group">
        <label className="label">Label</label>

        <input
          type="text"
          value={link.label}
          onChange={(e) => handleLinkChange(index, "label", e.target.value)}
          className="input"
          placeholder="e.g., Pixeldrain, Gofile"
        />
      </div>

      <div className="form-group">
        <label className="label">URL</label>

        <input
          type="url"
          value={link.url}
          onChange={(e) => handleLinkChange(index, "url", e.target.value)}
          className="input"
          placeholder="https://..."
        />
      </div>

      <button
        type="button"
        onClick={() => handleRemoveLink(index)}
        className="btn btn-danger btn-small"
      >
        Remove
      </button>
    </div>
  ))}

  <button type="button" onClick={handleAddLink} className="btn btn-secondary">
    + Add Link
  </button>
</div>
```

### 7. Save external links to post

You'll need to create a new table for external links or store them as JSON in the posts table.

Option A (JSON in posts table):

- Add `external_links` TEXT column to posts table

- Store as: `JSON.stringify(externalLinks.filter(l => l.label && l.url))`

Option B (New table):

- Create `external_links` table with columns: id, post_id, label, url

- Insert each link separately

## 📝 Database Migration Needed:

Run this SQL to add external_links column:

```sql

ALTER TABLE posts ADD COLUMN external_links TEXT;

```

Or create a new script: `scripts/add-external-links.ts`
