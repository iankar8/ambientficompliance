import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import {
  demoUsers,
  recipients,
  transactions,
  recordTransaction
} from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.DEMO_BANK_PORT ?? 4000);
const SESSION_SECRET = process.env.DEMO_BANK_SESSION_SECRET ?? 'demo-bank-secret';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId
    ? demoUsers.find((user) => user.id === req.session.userId)
    : undefined;
  res.locals.flash = req.session.flash ?? undefined;
  delete req.session.flash;
  next();
});

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  if (!req.session.userId) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    res.redirect('/login');
    return;
  }
  next();
}

app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    res.redirect('/dashboard');
    return;
  }
  res.render('login', { nextUrl: req.query.next ?? '/dashboard' });
});

app.post('/login', (req, res) => {
  const { username, password, nextUrl } = req.body as Record<string, string>;
  const user = demoUsers.find(
    (candidate) =>
      candidate.username.toLowerCase() === (username ?? '').toLowerCase() &&
      candidate.password === password
  );

  if (!user) {
    req.session.flash = { type: 'error', message: 'Invalid username or password.' };
    res.redirect('/login');
    return;
  }

  req.session.userId = user.id;
  res.redirect(typeof nextUrl === 'string' && nextUrl.startsWith('/') ? nextUrl : '/dashboard');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.post('/forgot-password', (req, res) => {
  const { email } = req.body as Record<string, string>;
  const user = demoUsers.find((candidate) => candidate.email.toLowerCase() === (email ?? '').toLowerCase());

  res.render('forgot-password-confirmation', {
    email,
    found: Boolean(user)
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  const user = demoUsers.find((candidate) => candidate.id === req.session.userId);
  res.render('dashboard', {
    user,
    recipients,
    recentTransactions: transactions.slice(0, 5)
  });
});

app.get('/zelle/send', requireAuth, (req, res) => {
  const user = demoUsers.find((candidate) => candidate.id === req.session.userId);
  res.render('zelle-send', {
    user,
    recipients,
    error: undefined,
    values: {
      recipientId: req.query.recipientId ?? recipients[0]?.id,
      amount: '',
      note: ''
    }
  });
});

app.post('/zelle/send', requireAuth, (req, res) => {
  const { recipientId, amount, note } = req.body as Record<string, string>;
  const user = demoUsers.find((candidate) => candidate.id === req.session.userId);
  const recipient = recipients.find((candidate) => candidate.id === recipientId);
  const parsedAmount = Number(amount);

  if (!recipient || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    res.render('zelle-send', {
      user,
      recipients,
      error: 'Enter a valid amount and recipient.',
      values: {
        recipientId,
        amount,
        note
      }
    });
    return;
  }

  const txId = randomUUID();
  recordTransaction({
    id: txId,
    userId: user!.id,
    recipientId,
    amount: parsedAmount,
    note,
    createdAt: new Date().toISOString()
  });

  res.render('zelle-success', {
    user,
    recipient,
    amount: parsedAmount,
    note,
    transactionId: txId
  });
});

app.listen(PORT, () => {
  console.log(`Demo bank server listening on http://localhost:${PORT}`);
});
