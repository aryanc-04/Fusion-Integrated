// path/to/modules/elm/models/elm_leave_balances.js
import { DataTypes, Model } from 'sequelize';

class ElmLeaveBalance extends Model {}

ElmLeaveBalance.init({
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'elm_leave_categories',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  accruedDays: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  usedDays: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  carryForwardCap: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  lastAccrualDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize: null, // This will be set by the Sequelize instance
  tableName: 'elm_leave_balances',
  indexes: [
    { fields: ['employeeId'] },
    { fields: ['categoryId'] },
    { unique: true, fields: ['employeeId', 'categoryId'] },
  ],
});

// Model-level validation helpers
ElmLeaveBalance.addHook('beforeValidate', async (instance) => {
  // Ensure balance doesn't exceed accrued amount minus used amount
  const maxBalance = instance.accruedDays - instance.usedDays;
  if (instance.balance > maxBalance && maxBalance >= 0) {
    throw new Error('Balance cannot exceed available accrued days');
  }
});

ElmLeaveBalance.addHook('beforeUpdate', async (instance, options) => {
  // Validate balance changes respect carry-forward caps
  const category = await instance.getCategory();
  if (category && category.carryForwardAllowed && instance.changed('balance')) {
    const cap = category.carryForwardCap || instance.carryForwardCap;
    if (cap && instance.balance > cap) {
      throw new Error(`Balance cannot exceed carry-forward cap of ${cap}`);
    }
  }
});

export default ElmLeaveBalance;
