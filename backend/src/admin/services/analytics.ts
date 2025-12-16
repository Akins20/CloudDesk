/**
 * Analytics Service
 * Server metrics, user analytics, session analytics, and aggregations
 */

import os from 'os';
import { User } from '../../models/User';
import { Instance } from '../../models/Instance';
import { Session } from '../../models/Session';

/**
 * Server performance metrics
 */
export interface ServerMetrics {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  uptime: {
    system: number;
    process: number;
    formatted: string;
  };
  load: number[];
  platform: string;
  hostname: string;
  nodeVersion: string;
}

/**
 * Get current server metrics
 */
export const getServerMetrics = async (): Promise<ServerMetrics> => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Calculate CPU usage
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  // Format uptime
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const formatted = `${days}d ${hours}h ${minutes}m`;

  return {
    cpu: {
      usage: Math.round(cpuUsage * 10) / 10,
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: Math.round((usedMem / totalMem) * 1000) / 10,
    },
    uptime: {
      system: uptimeSeconds,
      process: process.uptime(),
      formatted,
    },
    load: os.loadavg(),
    platform: `${os.platform()} ${os.release()}`,
    hostname: os.hostname(),
    nodeVersion: process.version,
  };
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * User analytics data
 */
export interface UserAnalytics {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  newToday: number;
  newThisWeek: number;
  newThisMonth: number;
  registrationsByDay: Array<{ date: string; count: number }>;
  registrationsByMonth: Array<{ month: string; count: number }>;
  topUsersByInstances: Array<{ user: any; instanceCount: number }>;
  topUsersBySessions: Array<{ user: any; sessionCount: number }>;
}

/**
 * Get user analytics
 */
export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    total,
    active,
    admins,
    newToday,
    newThisWeek,
    newThisMonth,
    registrationsByDay,
    registrationsByMonth,
    topUsersByInstances,
    topUsersBySessions,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekStart } }),
    User.countDocuments({ createdAt: { $gte: monthStart } }),

    // Registrations by day (last 30 days)
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]),

    // Registrations by month (last 12 months)
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { month: '$_id', count: 1, _id: 0 } },
    ]),

    // Top users by instance count
    Instance.aggregate([
      { $group: { _id: '$userId', instanceCount: { $sum: 1 } } },
      { $sort: { instanceCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { user: { email: 1, firstName: 1, lastName: 1 }, instanceCount: 1 } },
    ]),

    // Top users by session count
    Session.aggregate([
      { $group: { _id: '$userId', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $project: { user: { email: 1, firstName: 1, lastName: 1 }, sessionCount: 1 } },
    ]),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    admins,
    newToday,
    newThisWeek,
    newThisMonth,
    registrationsByDay,
    registrationsByMonth,
    topUsersByInstances,
    topUsersBySessions,
  };
};

/**
 * Session analytics data
 */
export interface SessionAnalytics {
  total: number;
  active: number;
  connected: number;
  disconnected: number;
  errors: number;
  todaySessions: number;
  avgDuration: number;
  sessionsByDay: Array<{ date: string; count: number }>;
  sessionsByStatus: Array<{ status: string; count: number }>;
  sessionsByHour: Array<{ hour: number; count: number }>;
  peakHour: number;
  errorRate: number;
}

/**
 * Get session analytics
 */
export const getSessionAnalytics = async (): Promise<SessionAnalytics> => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    total,
    connected,
    disconnected,
    errors,
    todaySessions,
    avgDurationResult,
    sessionsByDay,
    sessionsByStatus,
    sessionsByHour,
  ] = await Promise.all([
    Session.countDocuments(),
    Session.countDocuments({ status: { $in: ['connected', 'connecting'] } }),
    Session.countDocuments({ status: 'disconnected' }),
    Session.countDocuments({ status: 'error' }),
    Session.countDocuments({ createdAt: { $gte: todayStart } }),

    // Average session duration
    Session.aggregate([
      {
        $match: {
          connectionStartedAt: { $exists: true },
          connectionEndedAt: { $exists: true },
        },
      },
      {
        $project: {
          duration: { $subtract: ['$connectionEndedAt', '$connectionStartedAt'] },
        },
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
        },
      },
    ]),

    // Sessions by day (last 30 days)
    Session.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]),

    // Sessions by status
    Session.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
    ]),

    // Sessions by hour (last 7 days)
    Session.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { hour: '$_id', count: 1, _id: 0 } },
    ]),
  ]);

  const avgDuration = avgDurationResult[0]?.avgDuration || 0;
  const peakHour = sessionsByHour.reduce((max, curr) => (curr.count > max.count ? curr : max), { hour: 0, count: 0 }).hour;
  const errorRate = total > 0 ? Math.round((errors / total) * 1000) / 10 : 0;

  return {
    total,
    active: connected,
    connected,
    disconnected,
    errors,
    todaySessions,
    avgDuration: Math.round(avgDuration / 60000), // Convert to minutes
    sessionsByDay,
    sessionsByStatus,
    sessionsByHour,
    peakHour,
    errorRate,
  };
};

/**
 * Instance analytics data
 */
export interface InstanceAnalytics {
  total: number;
  byProvider: Array<{ provider: string; count: number }>;
  avgPerUser: number;
  mostUsedInstances: Array<{ instance: any; sessionCount: number }>;
}

/**
 * Get instance analytics
 */
export const getInstanceAnalytics = async (): Promise<InstanceAnalytics> => {
  const [total, byProvider, userCount, mostUsedInstances] = await Promise.all([
    Instance.countDocuments(),

    Instance.aggregate([
      { $group: { _id: '$provider', count: { $sum: 1 } } },
      { $project: { provider: '$_id', count: 1, _id: 0 } },
    ]),

    User.countDocuments(),

    Session.aggregate([
      { $group: { _id: '$instanceId', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'instances',
          localField: '_id',
          foreignField: '_id',
          as: 'instance',
        },
      },
      { $unwind: '$instance' },
      { $project: { instance: { name: 1, host: 1, provider: 1 }, sessionCount: 1 } },
    ]),
  ]);

  return {
    total,
    byProvider,
    avgPerUser: userCount > 0 ? Math.round((total / userCount) * 10) / 10 : 0,
    mostUsedInstances,
  };
};

/**
 * Dashboard summary stats
 */
export interface DashboardStats {
  users: { total: number; active: number; newToday: number; trend: number };
  instances: { total: number; avgPerUser: number };
  sessions: { total: number; active: number; todaySessions: number; errorRate: number };
  server: ServerMetrics;
}

/**
 * Get dashboard summary
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersYesterday,
    totalInstances,
    totalSessions,
    activeSessions,
    todaySessions,
    errorSessions,
    server,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
    Instance.countDocuments(),
    Session.countDocuments(),
    Session.countDocuments({ status: { $in: ['connected', 'connecting'] } }),
    Session.countDocuments({ createdAt: { $gte: todayStart } }),
    Session.countDocuments({ status: 'error' }),
    getServerMetrics(),
  ]);

  const userTrend = newUsersYesterday > 0
    ? Math.round(((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100)
    : newUsersToday > 0 ? 100 : 0;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      newToday: newUsersToday,
      trend: userTrend,
    },
    instances: {
      total: totalInstances,
      avgPerUser: totalUsers > 0 ? Math.round((totalInstances / totalUsers) * 10) / 10 : 0,
    },
    sessions: {
      total: totalSessions,
      active: activeSessions,
      todaySessions,
      errorRate: totalSessions > 0 ? Math.round((errorSessions / totalSessions) * 1000) / 10 : 0,
    },
    server,
  };
};

export default {
  getServerMetrics,
  formatBytes,
  getUserAnalytics,
  getSessionAnalytics,
  getInstanceAnalytics,
  getDashboardStats,
};
