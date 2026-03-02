const Database = require('better-sqlite3');
const db = new Database('database.db');

try {
    db.prepare('ALTER TABLE lawyers ADD COLUMN linkedin_url TEXT').run();
    db.prepare('ALTER TABLE lawyers ADD COLUMN instagram_url TEXT').run();
    db.prepare('ALTER TABLE lawyers ADD COLUMN facebook_url TEXT').run();
    console.log('Database migrated successfully: Added social media columns to lawyers table.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Columns already exist.');
    } else {
        console.error('Migration failed:', error);
    }
} finally {
    db.close();
}
