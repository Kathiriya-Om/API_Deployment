import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();

app.use(express.json());

// In-memory storage
let accounts = [];
let transactions = [];

// Basic route to confirm API is running
app.get('/api/v1', (req, res) => {
    res.json({
        message: "Banking API is running",
        endpoints: [
            "POST /account",
            "GET /account",
            "POST /deposit",
            "POST /withdraw",
            "GET /transactions/:id"
        ]
    });
});

// Helpful browser-friendly route to view accounts
app.get('/api/v1/account', (req, res) => {
    res.json({
        count: accounts.length,
        accounts
    });
});

/*
Create Account

POST /account
Body:
{
   "name": "Om",
   "initialBalance": 1000
}
*/
app.post('/api/v1/account', (req, res) => {
    const { name, initialBalance } = req.body;

    if (!name || initialBalance == null) {
        return res.status(400).json({
            error: "Name and initialBalance are required"
        });
    }

    if (initialBalance < 0) {
        return res.status(400).json({
            error: "Initial balance cannot be negative"
        });
    }

    const newAccount = {
        id: Date.now(),
        name,
        balance: initialBalance
    };

    accounts.push(newAccount);

    transactions.push({
        accountId: newAccount.id,
        type: "CREATE",
        amount: initialBalance,
        date: new Date()
    });

    res.status(201).json({
        message: "Account created successfully",
        account: newAccount
    });
});


/*

Deposit Money

POST /deposit
Body:
{
   "accountId": 123,
   "amount": 500
}
*/
app.post('/api/v1/deposit', (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || amount == null) {
        return res.status(400).json({
            error: "accountId and amount are required"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: "Deposit amount must be greater than 0"
        });
    }

    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    account.balance += amount;

    transactions.push({
        accountId,
        type: "DEPOSIT",
        amount,
        date: new Date()
    });

    res.json({
        message: "Deposit successful",
        balance: account.balance
    });
});


/*
Withdraw Money
POST /withdraw
Body:
{
   "accountId": 123,
   "amount": 300
}
*/
app.post('/api/v1/withdraw', (req, res) => {
    const { accountId, amount } = req.body;

    if (!accountId || amount == null) {
        return res.status(400).json({
            error: "accountId and amount are required"
        });
    }

    if (amount <= 0) {
        return res.status(400).json({
            error: "Withdraw amount must be greater than 0"
        });
    }

    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    // 🔥 Prevent Overdraft
    if (account.balance < amount) {
        return res.status(400).json({
            error: "Insufficient balance"
        });
    }

    account.balance -= amount;

    transactions.push({
        accountId,
        type: "WITHDRAW",
        amount,
        date: new Date()
    });

    res.json({
        message: "Withdrawal successful",
        balance: account.balance
    });
});


// Transaction history
app.get('/api/v1/transactions/:id', (req, res) => {
    const accountId = Number(req.params.id);

    const account = accounts.find(acc => acc.id === accountId);

    if (!account) {
        return res.status(404).json({
            error: "Account not found"
        });
    }

    const history = transactions.filter(
        txn => txn.accountId === accountId
    );

    res.json({
        accountId,
        balance: account.balance,
        transactions: history
    });
});


//server
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});