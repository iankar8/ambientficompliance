export interface DemoUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  balance: number;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  accountLast4: string;
}

export interface Transaction {
  id: string;
  userId: string;
  recipientId: string;
  amount: number;
  note: string;
  createdAt: string;
}

export const demoUsers: DemoUser[] = [
  {
    id: 'user-001',
    name: 'Ian K.',
    email: 'ian@demobank.local',
    username: 'demouser',
    password: 'Demo1234!',
    balance: 2500
  },
  {
    id: 'user-002',
    name: 'Alex M.',
    email: 'alex@demobank.local',
    username: 'alexdemo',
    password: 'Demo1234!',
    balance: 4100
  }
];

export const recipients: Recipient[] = [
  {
    id: 'rec-001',
    name: 'Taylor Smith',
    email: 'taylor@example.com',
    accountLast4: '4321'
  },
  {
    id: 'rec-002',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    accountLast4: '9876'
  }
];

export const transactions: Transaction[] = [];

export function recordTransaction(tx: Transaction): void {
  transactions.unshift(tx);
  if (transactions.length > 25) {
    transactions.length = 25;
  }
}
