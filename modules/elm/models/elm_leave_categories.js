// path/to/modules/elm/models/elm_leave_categories.js
import { DataTypes, Model } from 'sequelize';

class ElmLeaveCategory extends Model {}

ElmLeaveCategory.init({
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      isIn: [['CL', 'RH', 'SCL', 'EL', 'COL', 'VL']],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  entitlementDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 1000,
    },
  },
  carryForwardAllowed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  halfDaySupported: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  vacationPeriodRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  medicalEvidenceRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  minNoticeDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  maxConsecutiveDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
}, {
  sequelize: null, // This will be set by the Sequelize instance
  tableName: 'elm_leave_categories',
  indexes: [
    { fields: ['name'] },
  ],
});

export default ElmLeaveCategory;
