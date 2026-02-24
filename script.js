const STORAGE_KEY = 'expenses_v1';

const $ = selector => document.querySelector(selector);

let expenses = [];

function loadExpenses() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		expenses = raw ? JSON.parse(raw) : [];
	} catch (e) {
		console.error('Failed to parse expenses', e);
		expenses = [];
	}
}

function saveExpenses() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function formatCurrency(n) {
	return '₹' + Number(n).toFixed(2);
}

function renderExpenses() {
	const list = $('#expense-list');
	list.innerHTML = '';
	expenses.sort((a,b) => new Date(b.date) - new Date(a.date));
	for (const e of expenses) {
		const li = document.createElement('li');
		li.className = 'item';
		li.dataset.id = e.id;
		li.innerHTML = `
			<div class="item-left">
				<div class="desc">${escapeHtml(e.description)}</div>
				<div class="meta">${escapeHtml(e.category)} • ${e.date}</div>
			</div>
			<div class="item-right">
				<div class="amount">${formatCurrency(e.amount)}</div>
				<div class="buttons">
					<button class="edit">Edit</button>
					<button class="delete">Delete</button>
				</div>
			</div>
		`;
		list.appendChild(li);
	}
	updateTotal();
}

function updateTotal() {
	const total = expenses.reduce((s,e) => s + Number(e.amount), 0);
	$('#total').textContent = formatCurrency(total);
}

function escapeHtml(s){
	return String(s)
		.replaceAll('&','&amp;')
		.replaceAll('<','&lt;')
		.replaceAll('>','&gt;');
}

function addExpense(data) {
	const item = { id: Date.now().toString(), ...data };
	expenses.push(item);
	saveExpenses();
	renderExpenses();
}

function updateExpense(id, data) {
	const idx = expenses.findIndex(x => x.id === id);
	if (idx === -1) return;
	expenses[idx] = { ...expenses[idx], ...data };
	saveExpenses();
	renderExpenses();
}

function deleteExpense(id) {
	expenses = expenses.filter(x => x.id !== id);
	saveExpenses();
	renderExpenses();
}

function bindEvents() {
	const form = $('#expense-form');
	const saveBtn = $('#save-btn');
	const clearBtn = $('#clear-btn');

	form.addEventListener('submit', (ev)=>{
		ev.preventDefault();
		const data = {
			description: form.description.value.trim(),
			amount: Number(form.amount.value || 0),
			date: form.date.value || new Date().toISOString().slice(0,10),
			category: form.category.value || 'Other'
		};
		if (!data.description || !data.amount || data.amount <= 0) {
			alert('Please provide a valid description and positive amount.');
			return;
		}

		const editingId = form.dataset.editing;
		if (editingId) {
			updateExpense(editingId, data);
			delete form.dataset.editing;
			saveBtn.textContent = 'Add';
		} else {
			addExpense(data);
		}
		form.reset();
	});

	clearBtn.addEventListener('click', ()=>{
		form.reset();
		delete form.dataset.editing;
		saveBtn.textContent = 'Add';
	});

	$('#expense-list').addEventListener('click', (ev)=>{
		const li = ev.target.closest('li.item');
		if (!li) return;
		const id = li.dataset.id;
		if (ev.target.matches('.delete')) {
			if (confirm('Delete this expense?')) deleteExpense(id);
		} else if (ev.target.matches('.edit')) {
			const item = expenses.find(x=>x.id===id);
			if (!item) return;
			const form = $('#expense-form');
			form.description.value = item.description;
			form.amount.value = item.amount;
			form.date.value = item.date;
			form.category.value = item.category;
			form.dataset.editing = id;
			saveBtn.textContent = 'Save';
			window.scrollTo({top:0, behavior:'smooth'});
		}
	});
}

function init(){
	loadExpenses();
	bindEvents();
	renderExpenses();
}

document.addEventListener('DOMContentLoaded', init);

