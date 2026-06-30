import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface KnowledgeBaseAttributes {
  id: number;
  source: string;
  source_id: string;
  chunk_index: number;
  chunk_content: string;
  embeddings_768?: number[] | null;
  embeddings_1536?: number[] | null;
  created_at?: Date;
  updated_at?: Date;
}

interface KnowledgeBaseCreationAttributes
  extends Optional<
    KnowledgeBaseAttributes,
    'id' | 'created_at' | 'updated_at'
  > {}

class KnowledgeBase
  extends Model<KnowledgeBaseAttributes, KnowledgeBaseCreationAttributes>
  implements KnowledgeBaseAttributes
{
  public id!: number;
  public source!: string;
  public source_id!: string;
  public chunk_index!: number;
  public chunk_content!: string;
  public embeddings_768?: number[] | null;
  public embeddings_1536?: number[] | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

KnowledgeBase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    source_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    chunk_index: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    chunk_content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    embeddings_768: {
      type: DataTypes.ARRAY(DataTypes.REAL),
      allowNull: true,
    },
    embeddings_1536: {
      type: DataTypes.ARRAY(DataTypes.REAL),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'knowledge_base',
    timestamps: true,
    underscored: true,
  }
);

export default KnowledgeBase;
