'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE knowledge_base (
        id SERIAL PRIMARY KEY,
        source VARCHAR(255),
        source_id VARCHAR(255),
        chunk_index INTEGER,
        chunk_content TEXT,
        embeddings_768 vector(768),
        embeddings_1536 vector(1536),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create IVFFlat indexes for cosine similarity on each embedding column
    await queryInterface.sequelize.query(`
      CREATE INDEX knowledge_base_768_cosine_idx
      ON knowledge_base USING ivfflat (embeddings_768 vector_cosine_ops)
      WITH (lists = 100);
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX knowledge_base_1536_cosine_idx
      ON knowledge_base USING ivfflat (embeddings_1536 vector_cosine_ops)
      WITH (lists = 100);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('knowledge_base');
  },
};
