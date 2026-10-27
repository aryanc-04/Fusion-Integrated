// path/to/modules/elm/models/elm_leave_requests.js
import { DataTypes, Model } from 'sequelize';

class ElmLeaveRequest extends Model {}

ElmLeaveRequest.init({
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
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft',
  },
  purpose: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  stationLeaveDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  substituteEmployeeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  substituteConsentStatus: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    allowNull: true,
    defaultValue: null,
  },
  unitHeadRecommendation: {
    type: DataTypes.ENUM('recommended', 'not_recommended'),
    allowNull: true,
  },
  chargeableDays: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'elm_leave_requests',
  indexes: [
    { fields: ['employeeId'] },
    { fields: ['categoryId'] },
    { fields: ['status'] },
    { fields: ['startDate', 'endDate'] },
  ],
});

// Model-level validation helpers
ElmLeaveRequest.addHook('beforeValidate', async (instance) => {
  // Validate date range
  if (instance.startDate && instance.endDate) {
    const start = new Date(instance.startDate);
    const end = new Date(instance.endDate);
    if (end < start) {
      throw new Error('End date must be after start date');
    }
    
    // Check for overlapping dates with existing requests
    const existingRequests = await instance.constructor.findAll({
      where: {
        employeeId: instance.employeeId,
        status: { [Op.in]: ['submitted', 'approved'] },
      },
    });
    
    for (const existing of existingRequests) {
      if (existing.id !== instance.id) {
        const existingStart = new Date(existing.startDate);
        const existingEnd = new Date(existing.endDate);
        
        // Check for overlap, excluding half-day CL exception
        if (!instance.halfDayCL || !existing.halfDayCL) {
          if (start <= existingEnd && end >= existingStart) {
            throw new Error('Leave request overlaps with an active leave period');
          }
        }
      }
    }
  }
});

ElmLeaveRequest.addHook('beforeCreate', async (instance, options) => {
  // Validate category eligibility
  const category = await instance.getCategory();
  if (!category) {
    throw new Error('Invalid leave category');
  }
  
  // Check entitlement/balance
  const balance = await instance.getBalance();
  if (!balance || balance.balance < instance.chargeableDays) {
    throw new Error('Insufficient leave balance');
  }
});

ElmLeaveRequest.addHook('beforeUpdate', async (instance, options) => {
  // Prevent modification after submission (BR-EL-034)
  if (instance.changed('status') && instance.status === 'submitted') {
    throw new Error('Cannot modify a submitted request');
  }
  
  // Validate status transitions
  const oldStatus = instance.getDataValue('old_status');
  const newStatus = instance.getDataValue('status');
  
  if (oldStatus === 'draft' && newStatus !== 'draft') {
    throw new Error('Cannot change from draft to another status directly');
  }
});

export default ElmLeaveRequest;
