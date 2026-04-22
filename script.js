// Get DOM elements
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const transactionList = document.getElementById('transaction-list');
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expensesEl = document.getElementById('expenses');
const clearAllBtn = document.getElementById('clear-all');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const categorySummary = document.getElementById('category-summary');

// Initialize transactions array from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentFilter = 'all';
let searchTerm = '';

// Set today's date as default
dateInput.valueAsDate = new Date();

// Event Listeners
form.addEventListener('submit', addTransaction);
clearAllBtn.addEventListener('click', clearAllTransactions);
searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    displayTransactions();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        displayTransactions();
    });
});

// Add Transaction
function addTransaction(e) {
    e.preventDefault();

    const transaction = {
        id: generateID(),
        description: descriptionInput.value.trim(),
        amount: parseFloat(amountInput.value),
        type: typeSelect.value,
        category: categorySelect.value,
        date: dateInput.value
    };

    transactions.push(transaction);
    saveToLocalStorage();
    displayTransactions();
    updateSummary();
    updateCategorySummary();
    
    // Reset form
    form.reset();
    dateInput.valueAsDate = new Date();

    // Show success message (optional)
    showNotification('Transaction added successfully!', 'success');
}

// Generate unique ID
function generateID() {
    return Date.now().toString();
}

// Display Transactions
function displayTransactions() {
    transactionList.innerHTML = '';

    // Filter transactions
    let filteredTransactions = transactions.filter(transaction => {
        const matchesFilter = currentFilter === 'all' || transaction.type === currentFilter;
        const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                            transaction.category.toLowerCase().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No transactions found</p>
            </div>
        `;
        return;
    }

    filteredTransactions.forEach(transaction => {
        const transactionEl = document.createElement('div');
        transactionEl.classList.add('transaction-item', transaction.type);
        
        const sign = transaction.type === 'income' ? '+' : '-';
        const formattedDate = formatDate(transaction.date);
        
        transactionEl.innerHTML = `
            <div class="transaction-details">
                <h4>${transaction.description}</h4>
                <div class="transaction-meta">
                    <span><i class="fas fa-tag"></i> ${transaction.category}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${sign}₹${transaction.amount.toFixed(2)}
            </div>
            <button class="btn-delete" onclick="deleteTransaction('${transaction.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        transactionList.appendChild(transactionEl);
    });
}

// Delete Transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(transaction => transaction.id !== id);
        saveToLocalStorage();
        displayTransactions();
        updateSummary();
        updateCategorySummary();
        showNotification('Transaction deleted!', 'error');
    }
}

// Clear All Transactions
function clearAllTransactions() {
    if (confirm('Are you sure you want to clear all transactions? This cannot be undone!')) {
        transactions = [];
        saveToLocalStorage();
        displayTransactions();
        updateSummary();
        updateCategorySummary();
        showNotification('All transactions cleared!', 'error');
    }
}

// Update Summary
function updateSummary() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((total, t) => total + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((total, t) => total + t.amount, 0);

    const balance = income - expenses;

    balanceEl.textContent = `₹${balance.toFixed(2)}`;
    incomeEl.textContent = `₹${income.toFixed(2)}`;
    expensesEl.textContent = `₹${expenses.toFixed(2)}`;

    // Color balance based on value
    if (balance >= 0) {
        balanceEl.style.color = 'var(--success-color)';
    } else {
        balanceEl.style.color = 'var(--danger-color)';
    }
}

// Update Category Summary
function updateCategorySummary() {
    const categoryTotals = {};
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
        if (categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] += transaction.amount;
        } else {
            categoryTotals[transaction.category] = transaction.amount;
        }
    });

    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    categorySummary.innerHTML = '';

    if (Object.keys(categoryTotals).length === 0) {
        categorySummary.innerHTML = '<p style="text-align: center; color: #9ca3af;">No expense data available</p>';
        return;
    }

    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([category, amount]) => {
        const percentage = ((amount / totalExpenses) * 100).toFixed(1);
        
        const categoryEl = document.createElement('div');
        categoryEl.classList.add('category-item');
        categoryEl.innerHTML = `
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span class="category-name">${category}</span>
                    <span class="category-amount">₹${amount.toFixed(2)}</span>
                </div>
                <div class="category-bar">
                    <div class="category-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <small style="color: #6b7280;">${percentage}% of total expenses</small>
            </div>
        `;
        categorySummary.appendChild(categoryEl);
    });
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Save to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Show Notification (optional feature)
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        border-radius: 10px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app
displayTransactions();
updateSummary();
updateCategorySummary();