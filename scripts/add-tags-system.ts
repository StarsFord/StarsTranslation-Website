import { db } from '../server/database/db.js';

console.log('🔄 Creating tags system...\n');

try {
  // Create tag_types table
  (db as any).exec(`
    CREATE TABLE IF NOT EXISTS tag_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tags table
  (db as any).exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_type_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tag_type_id) REFERENCES tag_types(id) ON DELETE CASCADE,
      UNIQUE(tag_type_id, slug)
    )
  `);

  // Create post_tags junction table
  (db as any).exec(`
    CREATE TABLE IF NOT EXISTS post_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
      UNIQUE(post_id, tag_id)
    )
  `);

  console.log('✅ Tables created successfully!\n');

  // Insert default tag types
  const tagTypes = [
    { name: 'Platform', slug: 'platform', description: 'Game engine or platform' },
    { name: 'Genre', slug: 'genre', description: 'Game genre' },
    { name: 'Fetish', slug: 'fetish', description: 'Adult content tags' }
  ];

  tagTypes.forEach(type => {
    try {
      db.prepare(`
        INSERT OR IGNORE INTO tag_types (name, slug, description)
        VALUES (?, ?, ?)
      `).run(type.name, type.slug, type.description);
    } catch (e) {
      // Ignore duplicates
    }
  });

  console.log('✅ Default tag types created!\n');

  // Insert default platforms
  const platforms = [
    'Unity', 'Unreal Engine', 'RPG Maker', 'Kirikiri', 'Tyrano',
    'Godot', 'Ren\'Py', 'Wolf RPG', 'HTML', 'Flash'
  ];

  const platformTypeId = db.prepare('SELECT id FROM tag_types WHERE slug = ?').get('platform') as any;

  platforms.forEach(platform => {
    try {
      const slug = platform.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      db.prepare(`
        INSERT OR IGNORE INTO tags (tag_type_id, name, slug)
        VALUES (?, ?, ?)
      `).run(platformTypeId.id, platform, slug);
    } catch (e) {
      // Ignore duplicates
    }
  });

  console.log('✅ Default platforms created!\n');

  // Insert default genres
  const genres = [
    'Action', 'Adventure', 'RPG', 'Visual Novel', 'Simulation',
    'Strategy', 'Puzzle', 'Dating Sim', 'Dungeon Crawler', 'Isekai'
  ];

  const genreTypeId = db.prepare('SELECT id FROM tag_types WHERE slug = ?').get('genre') as any;

  genres.forEach(genre => {
    try {
      const slug = genre.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      db.prepare(`
        INSERT OR IGNORE INTO tags (tag_type_id, name, slug)
        VALUES (?, ?, ?)
      `).run(genreTypeId.id, genre, slug);
    } catch (e) {
      // Ignore duplicates
    }
  });

  console.log('✅ Default genres created!\n');

  console.log('📊 Tag system summary:');
  const tagTypesCount = db.prepare('SELECT COUNT(*) as count FROM tag_types').get() as any;
  const tagsCount = db.prepare('SELECT COUNT(*) as count FROM tags').get() as any;
  console.log(`  - Tag Types: ${tagTypesCount.count}`);
  console.log(`  - Tags: ${tagsCount.count}`);

  console.log('\n✅ Tags system created successfully!');

} catch (error: any) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
