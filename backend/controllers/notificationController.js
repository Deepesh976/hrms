const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const { getReportingEmployees } = require('../services/hierarchyService');

/* =========================
   LIST NOTIFICATIONS
========================= */
const listForRole = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role || 'employee';
    const employeeObjectId = req.user?.employeeId;

    let query = {};

    // EMPLOYEE / HR-EMPLOYEE → view only
    if (role === 'employee' || role === 'hr-employee') {
      const employee = await Employee.findById(employeeObjectId);
      if (!employee) return res.status(200).json([]);

      query = {
        $or: [
          { audience: 'all' },
          { audience: 'department', targetDepartment: employee.department },
          { audience: 'individual', targetEmployeeIds: employee._id },
          { audience: 'team', targetEmployeeIds: employee._id },
          { targetEmployeeIds: employee._id }
        ]
      };
    }
    // OTHERS → all + own created
    else {
      query = {
        $or: [
          { audience: 'all' },
          { createdBy: userId }
        ]
      };
    }

    const items = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('createdBy', 'username role')
      .lean();

    return res.status(200).json(items);
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* =========================
   CREATE NOTIFICATION
========================= */
const create = async (req, res) => {
  try {
    const { title, message, audience = 'all', targetDepartment = '', targetEmployeeIds = [] } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    if (!userId || !role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let finalAudience = audience;
    let finalTargetEmployeeIds = [];
    let finalTargetDepartment = '';

    // HRMS / ADMIN / SUPER ADMIN
    if (['hrms_handler', 'admin', 'superadmin', 'super_admin'].includes(role)) {
      if (audience === 'department' && targetDepartment) {
        const deptEmployees = await Employee.find({
          empStatus: 'W',
          department: targetDepartment
        }).select('_id');

        finalTargetEmployeeIds = deptEmployees.map(e => e._id);
        finalTargetDepartment = targetDepartment;
      }
      else if (audience === 'individual' && targetEmployeeIds.length) {
        finalTargetEmployeeIds = targetEmployeeIds;
      }
      else {
        const allEmployees = await Employee.find({ empStatus: 'W' }).select('_id');
        finalTargetEmployeeIds = allEmployees.map(e => e._id);
        finalAudience = 'all';
      }
    }

    // HOD
    else if (role === 'hod') {
      const allocatedEmployees = await getReportingEmployees(userId, role);
      if (!allocatedEmployees.length) {
        return res.status(400).json({ message: 'No allocated employees' });
      }

      if (audience === 'individual' && targetEmployeeIds.length) {
        const allowedIds = allocatedEmployees.map(e => e._id.toString());
        finalTargetEmployeeIds = targetEmployeeIds.filter(id =>
          allowedIds.includes(id.toString())
        );
        finalAudience = 'individual';
      } else {
        finalTargetEmployeeIds = allocatedEmployees.map(e => e._id);
        finalAudience = 'team';
      }
    }

    // DIRECTOR
    else if (role === 'director') {
      const allocatedEmployees = await getReportingEmployees(userId, role);
      if (!allocatedEmployees.length) {
        return res.status(400).json({ message: 'No allocated employees' });
      }

      if (audience === 'individual' && targetEmployeeIds.length) {
        const allowedIds = allocatedEmployees.map(e => e._id.toString());
        finalTargetEmployeeIds = targetEmployeeIds.filter(id =>
          allowedIds.includes(id.toString())
        );
        finalAudience = 'individual';
      } else {
        finalTargetEmployeeIds = allocatedEmployees.map(e => e._id);
        finalAudience = 'team';
      }
    }

    else {
      return res.status(403).json({ message: 'Permission denied' });
    }

    const doc = await Notification.create({
      title,
      message,
      audience: finalAudience,
      targetDepartment: finalTargetDepartment,
      targetEmployeeIds: finalTargetEmployeeIds,
      createdBy: userId,
      createdByRole: role,
    });

    return res.status(201).json(doc);
  } catch (err) {
    console.error('Create notification error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* =========================
   DELETE NOTIFICATION 🔐
========================= */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const createdByRole = notification.createdByRole;
    let allowedRoles = [];

    // 🔐 DELETE PERMISSION MATRIX
    switch (createdByRole) {
      case 'hrms_handler':
        allowedRoles = ['hrms_handler', 'super_admin'];
        break;

      case 'director':
        allowedRoles = ['director', 'hrms_handler', 'super_admin'];
        break;

      case 'hod':
        allowedRoles = ['hod', 'director', 'hrms_handler', 'super_admin'];
        break;

      case 'super_admin':
        allowedRoles = ['super_admin'];
        break;

      default:
        // employee / unknown → no delete
        allowedRoles = [];
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        message: 'You are not allowed to delete this notification'
      });
    }

    await notification.deleteOne();

    return res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* =========================
   UNREAD COUNT
========================= */
const getUnreadCount = async (req, res) => {
  try {
    const employeeObjectId = req.user?.employeeId;
    const role = req.user?.role;

    if (role === 'employee' || role === 'hr-employee') {
      const employee = await Employee.findById(employeeObjectId);
      if (!employee) return res.status(200).json({ count: 0 });

      const count = await Notification.countDocuments({
        $or: [
          { audience: 'all' },
          { audience: 'department', targetDepartment: employee.department },
          { audience: 'individual', targetEmployeeIds: employee._id },
          { audience: 'team', targetEmployeeIds: employee._id },
          { targetEmployeeIds: employee._id }
        ],
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      return res.status(200).json({ count });
    }

    return res.status(200).json({ count: 0 });
  } catch (err) {
    console.error('Get unread count error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  listForRole,
  create,
  remove,
  getUnreadCount
};
