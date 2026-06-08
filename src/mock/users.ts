import type { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'u001',
    name: '林若曦',
    email: 'linruoxi@corp.com',
    role: 'product',
    department: '产品部',
    avatar: 'LR',
  },
  {
    id: 'u002',
    name: '陈墨白',
    email: 'chenmobai@corp.com',
    role: 'tester',
    department: '质量保障部',
    avatar: 'CM',
  },
  {
    id: 'u003',
    name: '沈知行',
    email: 'shenzhixing@corp.com',
    role: 'provider',
    department: '支付中台',
    avatar: 'SZ',
  },
  {
    id: 'u004',
    name: '苏清岚',
    email: 'suqinglan@corp.com',
    role: 'provider',
    department: '用户中心',
    avatar: 'SQ',
  },
  {
    id: 'u005',
    name: '周慕白',
    email: 'zhoumubai@corp.com',
    role: 'consumer',
    department: '电商前台',
    avatar: 'ZM',
  },
  {
    id: 'u006',
    name: '顾北辰',
    email: 'gubeichen@corp.com',
    role: 'consumer',
    department: '运营后台',
    avatar: 'GB',
  },
  {
    id: 'u007',
    name: '叶知秋',
    email: 'yezhiqiu@corp.com',
    role: 'admin',
    department: '平台架构组',
    avatar: 'YZ',
  },
  {
    id: 'u008',
    name: '江晚晴',
    email: 'jiangwanqing@corp.com',
    role: 'tester',
    department: '质量保障部',
    avatar: 'JW',
  },
];

export const currentUser = mockUsers[0];
