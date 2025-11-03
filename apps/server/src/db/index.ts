import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute } from 'sequelize';

import { getEnv } from '../config/env.js';

const env = getEnv();

// Normalize DATABASE_URL by removing Postgres-style TLS params that mysql2 does not understand.
const sequelizeUrl = (() => {
  try {
    const parsedUrl = new URL(env.DATABASE_URL);
    const sslmode = parsedUrl.searchParams.get('sslmode');
    const sslaccept = parsedUrl.searchParams.get('sslaccept');

    if (sslmode) {
      parsedUrl.searchParams.delete('sslmode');
    }

    if (sslaccept) {
      parsedUrl.searchParams.delete('sslaccept');
    }

    return {
      url: parsedUrl.toString(),
      sslmode: sslmode?.toLowerCase(),
      sslaccept: sslaccept?.toLowerCase(),
    };
  } catch {
    return {
      url: env.DATABASE_URL,
      sslmode: undefined,
      sslaccept: undefined,
    };
  }
})();

const sequelizeOptions: Record<string, unknown> = {};

if (sequelizeUrl.sslmode && sequelizeUrl.sslmode !== 'disable') {
  const acceptInvalidCerts = sequelizeUrl.sslaccept === 'accept_invalid_certs';
  sequelizeOptions.dialectOptions = {
    ssl: { rejectUnauthorized: !acceptInvalidCerts },
  };
}

export const sequelize = new Sequelize(sequelizeUrl.url, {
  dialect: 'mysql',
  logging: false,
  define: {
    underscored: true,
  },
  ...sequelizeOptions,
});

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare lineUserId: string;
  declare displayName: CreationOptional<string | null>;
  declare avatar: CreationOptional<string | null>;
  declare rewardPoints: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare bookings?: NonAttribute<Booking[]>;
  declare rewardLogs?: NonAttribute<RewardLog[]>;
}

export class Sweet extends Model<InferAttributes<Sweet>, InferCreationAttributes<Sweet>> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare description: string;
  declare imageUrl: CreationOptional<string | null>;
  declare tag: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare bookings?: NonAttribute<Booking[]>;
}

export class Booking extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare sweetId: number;
  declare date: Date;
  declare timeSlot: string;
  declare status: CreationOptional<BookingStatus>;
  declare note: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare sweet?: NonAttribute<Sweet>;
}

export class RewardLog extends Model<InferAttributes<RewardLog>, InferCreationAttributes<RewardLog>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare delta: number;
  declare reason: string;
  declare createdAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    lineUserId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    displayName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    avatar: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      defaultValue: null,
    },
    rewardPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['line_user_id'],
        unique: true,
      },
    ],
  }
);

Sweet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(1024),
      allowNull: true,
      defaultValue: null,
    },
    tag: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'sweets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

Booking.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
    },
    sweetId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'sweet_id',
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    timeSlot: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'time_slot',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'bookings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['sweet_id'] },
      { fields: ['status'] },
    ],
  }
);

RewardLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
    },
    delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'reward_logs',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['created_at'] },
    ],
  }
);

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Sweet.hasMany(Booking, { foreignKey: 'sweet_id', as: 'bookings' });
Booking.belongsTo(Sweet, { foreignKey: 'sweet_id', as: 'sweet' });

User.hasMany(RewardLog, { foreignKey: 'user_id', as: 'rewardLogs' });
RewardLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

let initialized = false;

export async function initDatabase(): Promise<void> {
  if (initialized) {
    return;
  }
  await sequelize.authenticate();
  await sequelize.sync();
  initialized = true;
}

export async function closeDatabase(): Promise<void> {
  if (!initialized) {
    return;
  }
  await sequelize.close();
  initialized = false;
}
