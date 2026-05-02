const CATEGORIES = {
    food: { name: 'Food & Dining', icon: '🍔', color: '#ef4444' },
    shopping: { name: 'Shopping', icon: '🛍️', color: '#f59e0b' },
    transport: { name: 'Transport', icon: '🚗', color: '#3b82f6' },
    bills: { name: 'Bills & Utilities', icon: '📱', color: '#8b5cf6' },
    entertainment: { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
    health: { name: 'Health', icon: '💊', color: '#10b981' },
    education: { name: 'Education', icon: '📚', color: '#06b6d4' },
    other: { name: 'Other', icon: '📦', color: '#64748b' }
};

// State Management
class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.charts = {};
        this.currentView = 'dashboard';
        this.editingId = null;
        
        this.init();
    }

    // Initialize Application
    init() {
        this.bindEvents();
        this.populateCategoryFilters();
        this.setDefaultDate();
        this.updateDashboard();
        this.initCharts();
        this.renderRecentTransactions();
        this.renderAllTransactions();
        this.applyTheme();
    }

    // LocalStorage Operations
    loadExpenses() {
        const data = localStorage.getItem('expenses');
        return data ? JSON.parse(data) : this.getSampleData();
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    // Sample Data for Demo
    getSampleData() {
        const today = new Date();
        const sampleData = [
            { id: 1, description: 'Grocery Shopping', amount: 85.50, category: 'food', date: this.formatDate(new Date(today - 1 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 2, description: 'Netflix Subscription', amount: 15.99, category: 'entertainment', date: this.formatDate(new Date(today - 2 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 3, description: 'Uber Ride', amount: 24.00, category: 'transport', date: this.formatDate(new Date(today - 3 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 4, description: 'Electric Bill', amount: 120.00, category: 'bills', date: this.formatDate(new Date(today - 5 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 5, description: 'New Headphones', amount: 199.99, category: 'shopping', date: this.formatDate(new Date(today - 7 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 6, description: 'Restaurant Dinner', amount: 65.00, category: 'food', date: this.formatDate(new Date(today - 10 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 7, description: 'Online Course', amount: 49.99, category: 'education', date: this.formatDate(new Date(today - 15 * 24 * 60 * 60 * 1000)), notes: '' },
            { id: 8, description: 'Pharmacy', amount: 35.50, category: 'health', date: this.formatDate(new Date(today - 20 * 24 * 60 * 60 * 1000)), notes: '' },
        ];
        return sampleData;
    }

    // Event Bindings
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });

        document.querySelectorAll('.view-all').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(link.dataset.view);
            });
        });

        // Theme Toggle
        document.getElementById('themeBtn').addEventListener('click', () => this.toggleTheme());

        // Modal
        document.getElementById('addExpenseBtn').addEventListener('click', () => this.openModal());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('expenseModal').addEventListener('click', (e) => {
            if (e.target.id === 'expenseModal') this.closeModal();
        });

        // Form
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleSubmit(e));

        // Filters
        document.getElementById('filterCategory').addEventListener('change', () => this.renderAllTransactions());
        document.getElementById('filterDate').addEventListener('change', () => this.renderAllTransactions());
        document.getElementById('sortBy').addEventListener('change', () => this.renderAllTransactions());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
            if (e.key === 'n' && e.ctrlKey) {
                e.preventDefault();
                this.openModal();
            }
        });
    }

    // View Management
    switchView(viewName) {
        this.currentView = viewName;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');

        // Update header
        const titles = {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            analytics: 'Analytics'
        };
        document.querySelector('.page-title').textContent = titles[viewName];

        // Refresh data
        if (viewName === 'analytics') {
            this.renderAnalytics();
        }
    }

    // Theme Management
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.dataset.theme === 'dark';
        html.dataset.theme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', html.dataset.theme);
        
        const btn = document.getElementById('themeBtn');
        btn.innerHTML = isDark 
            ? '<span class="theme-icon">🌙</span><span>Dark Mode</span>'
            : '<span class="theme-icon">☀️</span><span>Light Mode</span>';

        this.updateChartColors();
    }

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.dataset.theme = savedTheme;
        
        const btn = document.getElementById('themeBtn');
        btn.innerHTML = savedTheme === 'dark'
            ? '<span class="theme-icon">☀️</span><span>Light Mode</span>'
            : '<span class="theme-icon">🌙</span><span>Dark Mode</span>';
    }

    // Modal Management
    openModal(expense = null) {
        const modal = document.getElementById('expenseModal');
        const form = document.getElementById('expenseForm');
        const title = document.getElementById('modalTitle');

        form.reset();
        this.setDefaultDate();

        if (expense) {
            this.editingId = expense.id;
            title.textContent = 'Edit Expense';
            document.getElementById('expenseId').value = expense.id;
            document.getElementById('description').value = expense.description;
            document.getElementById('amount').value = expense.amount;
            document.getElementById('category').value = expense.category;
            document.getElementById('date').value = expense.date;
            document.getElementById('notes').value = expense.notes || '';
        } else {
            this.editingId = null;
            title.textContent = 'Add Expense';
        }

        modal.classList.add('active');
        document.getElementById('description').focus();
    }

    closeModal() {
        document.getElementById('expenseModal').classList.remove('active');
        this.editingId = null;
    }

    // Form Handling
    handleSubmit(e) {
        e.preventDefault();

        const expense = {
            id: this.editingId || Date.now(),
            description: document.getElementById('description').value.trim(),
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            notes: document.getElementById('notes').value.trim()
        };

        if (this.editingId) {
            const index = this.expenses.findIndex(e => e.id === this.editingId);
            if (index !== -1) {
                this.expenses[index] = expense;
                this.showToast('Expense updated successfully', 'success');
            }
        } else {
            this.expenses.unshift(expense);
            this.showToast('Expense added successfully', 'success');
        }

        this.saveExpenses();
        this.closeModal();
        this.refreshAll();
    }

    // CRUD Operations
    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== id);
            this.saveExpenses();
            this.refreshAll();
            this.showToast('Expense deleted', 'success');
        }
    }

    // Dashboard Updates
    updateDashboard() {
        const total = this.expenses.reduce((sum, e) => sum + e.amount, 0);
        const thisMonth = this.getMonthlyExpenses();
        const count = this.expenses.length;
        const topCategory = this.getTopCategory();

        document.getElementById('totalBalance').textContent = this.formatCurrency(total);
        document.getElementById('monthlyExpenses').textContent = this.formatCurrency(thisMonth);
        document.getElementById('transactionCount').textContent = count;
        document.getElementById('topCategory').textContent = topCategory 
            ? `${CATEGORIES[topCategory].icon} ${CATEGORIES[topCategory].name.split(' ')[0]}`
            : '-';
    }

    getMonthlyExpenses() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return this.expenses
            .filter(e => new Date(e.date) >= startOfMonth)
            .reduce((sum, e) => sum + e.amount, 0);
    }

    getTopCategory() {
        const categoryTotals = {};
        this.expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });
        
        let maxCategory = null;
        let maxAmount = 0;
        for (const [cat, amount] of Object.entries(categoryTotals)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                maxCategory = cat;
            }
        }
        return maxCategory;
    }

    // Render Transactions
    renderRecentTransactions() {
        const container = document.getElementById('recentTransactions');
        const recent = this.expenses.slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No transactions yet</h3>
                    <p>Add your first expense to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recent.map(expense => this.createTransactionItem(expense)).join('');
        this.bindTransactionActions(container);
    }

    renderAllTransactions() {
        const container = document.getElementById('allTransactions');
        let filtered = this.applyFilters();
        filtered = this.applySorting(filtered);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(expense => this.createTableRow(expense)).join('');
        this.bindTransactionActions(container);
    }

    createTransactionItem(expense) {
        const cat = CATEGORIES[expense.category];
        return `
            <div class="transaction-item" data-id="${expense.id}">
                <div class="transaction-icon">${cat.icon}</div>
                <div class="transaction-details">
                    <div class="transaction-description">${this.escapeHtml(expense.description)}</div>
                    <div class="transaction-meta">${cat.name} • ${this.formatDateDisplay(expense.date)}</div>
                </div>
                <div class="transaction-amount">-${this.formatCurrency(expense.amount)}</div>
                <div class="transaction-actions">
                    <button class="action-btn edit" title="Edit">✏️</button>
                    <button class="action-btn delete" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }

    createTableRow(expense) {
        const cat = CATEGORIES[expense.category];
        return `
            <div class="table-row" data-id="${expense.id}">
                <span>${this.escapeHtml(expense.description)}</span>
                <span><span class="category-badge">${cat.icon} ${cat.name}</span></span>
                <span>${this.formatDateDisplay(expense.date)}</span>
                <span class="transaction-amount">-${this.formatCurrency(expense.amount)}</span>
                <span class="transaction-actions" style="opacity: 1;">
                    <button class="action-btn edit" title="Edit">✏️</button>
                    <button class="action-btn delete" title="Delete">🗑️</button>
                </span>
            </div>
        `;
    }

    bindTransactionActions(container) {
        container.querySelectorAll('.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('[data-id]').dataset.id);
                const expense = this.expenses.find(exp => exp.id === id);
                if (expense) this.openModal(expense);
            });
        });

        container.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('[data-id]').dataset.id);
                this.deleteExpense(id);
            });
        });
    }

    // Filters & Sorting
    applyFilters() {
        let filtered = [...this.expenses];
        
        const categoryFilter = document.getElementById('filterCategory').value;
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(e => e.category === categoryFilter);
        }

        const dateFilter = document.getElementById('filterDate').value;
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (dateFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filtered = filtered.filter(e => new Date(e.date) >= today);
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(e => new Date(e.date) >= weekAgo);
        } else if (dateFilter === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filtered = filtered.filter(e => new Date(e.date) >= startOfMonth);
        } else if (dateFilter === 'year') {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filtered = filtered.filter(e => new Date(e.date) >= startOfYear);
        }

        return filtered;
    }

    applySorting(expenses) {
        const sortBy = document.getElementById('sortBy').value;
        
        return expenses.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                default:
                    return 0;
            }
        });
    }

    populateCategoryFilters() {
        const select = document.getElementById('filterCategory');
        for (const [key, cat] of Object.entries(CATEGORIES)) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${cat.icon} ${cat.name}`;
            select.appendChild(option);
        }
    }

    // Charts
    initCharts() {
        this.initSpendingChart();
        this.initCategoryChart();
    }

    initSpendingChart() {
        const ctx = document.getElementById('spendingChart').getContext('2d');
        const data = this.getWeeklyData();

        this.charts.spending = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Daily Spending',
                    data: data.values,
                    backgroundColor: 'rgba(99, 102, 241, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    initCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const data = this.getCategoryData();

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors,
                    borderWidth: 0,
                    spacing: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    }

    getWeeklyData() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const labels = [];
        const values = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(days[date.getDay()]);
            
            const dateStr = this.formatDate(date);
            const dayTotal = this.expenses
                .filter(e => e.date === dateStr)
                .reduce((sum, e) => sum + e.amount, 0);
            values.push(dayTotal);
        }

        return { labels, values };
    }

    getCategoryData() {
        const categoryTotals = {};
        this.expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        const sorted = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            labels: sorted.map(([cat]) => CATEGORIES[cat].name),
            values: sorted.map(([, val]) => val),
            colors: sorted.map(([cat]) => CATEGORIES[cat].color)
        };
    }

    updateCharts() {
        // Update spending chart
        const weeklyData = this.getWeeklyData();
        this.charts.spending.data.labels = weeklyData.labels;
        this.charts.spending.data.datasets[0].data = weeklyData.values;
        this.charts.spending.update();

        // Update category chart
        const categoryData = this.getCategoryData();
        this.charts.category.data.labels = categoryData.labels;
        this.charts.category.data.datasets[0].data = categoryData.values;
        this.charts.category.data.datasets[0].backgroundColor = categoryData.colors;
        this.charts.category.update();
    }

    updateChartColors() {
        const isDark = document.documentElement.dataset.theme === 'dark';
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)';

        if (this.charts.spending) {
            this.charts.spending.options.scales.y.ticks.color = textColor;
            this.charts.spending.options.scales.x.ticks.color = textColor;
            this.charts.spending.options.scales.y.grid.color = gridColor;
            this.charts.spending.update();
        }

        if (this.charts.category) {
            this.charts.category.options.plugins.legend.labels.color = textColor;
            this.charts.category.update();
        }

        if (this.charts.trend) {
            this.charts.trend.options.scales.y.ticks.color = textColor;
            this.charts.trend.options.scales.x.ticks.color = textColor;
            this.charts.trend.options.scales.y.grid.color = gridColor;
            this.charts.trend.update();
        }

        if (this.charts.breakdown) {
            this.charts.breakdown.options.plugins.legend.labels.color = textColor;
            this.charts.breakdown.update();
        }
    }

    // Analytics
    renderAnalytics() {
        this.initTrendChart();
        this.initBreakdownChart();
        this.renderCategoryStats();
    }

    initTrendChart() {
        const ctx = document.getElementById('trendChart').getContext('2d');
        const data = this.getMonthlyTrendData();

        if (this.charts.trend) {
            this.charts.trend.destroy();
        }

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Monthly Spending',
                    data: data.values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(148, 163, 184, 0.1)' },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b' }
                    }
                }
            }
        });
    }

    initBreakdownChart() {
        const ctx = document.getElementById('breakdownChart').getContext('2d');
        const data = this.getCategoryData();

        if (this.charts.breakdown) {
            this.charts.breakdown.destroy();
        }

        this.charts.breakdown = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: data.colors.map(c => c + '99'),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            color: '#64748b'
                        }
                    }
                }
            }
        });
    }

    getMonthlyTrendData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const labels = [];
        const values = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(months[date.getMonth()]);
            
            const monthTotal = this.expenses
                .filter(e => {
                    const expDate = new Date(e.date);
                    return expDate.getMonth() === date.getMonth() && 
                           expDate.getFullYear() === date.getFullYear();
                })
                .reduce((sum, e) => sum + e.amount, 0);
            values.push(monthTotal);
        }

        return { labels, values };
    }

    renderCategoryStats() {
        const container = document.getElementById('categoryStats');
        const categoryTotals = {};
        let maxAmount = 0;

        this.expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
            if (categoryTotals[e.category] > maxAmount) {
                maxAmount = categoryTotals[e.category];
            }
        });

        const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No data available</p>
                </div>
            `;
            return;
        }

        container.innerHTML = sorted.map(([cat, amount]) => {
            const percentage = (amount / maxAmount) * 100;
            const catInfo = CATEGORIES[cat];
            return `
                <div class="stat-item">
                    <div class="stat-item-icon">${catInfo.icon}</div>
                    <div class="stat-item-info">
                        <div class="stat-item-name">${catInfo.name}</div>
                        <div class="stat-item-bar">
                            <div class="stat-item-bar-fill" style="width: ${percentage}%; background: ${catInfo.color}"></div>
                        </div>
                    </div>
                    <div class="stat-item-value">${this.formatCurrency(amount)}</div>
                </div>
            `;
        }).join('');
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    setDefaultDate() {
        document.getElementById('date').value = this.formatDate(new Date());
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    refreshAll() {
        this.updateDashboard();
        this.updateCharts();
        this.renderRecentTransactions();
        this.renderAllTransactions();
        if (this.currentView === 'analytics') {
            this.renderAnalytics();
        }
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ExpenseTracker();
});
