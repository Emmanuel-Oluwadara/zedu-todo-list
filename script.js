const STORAGE_KEY = "daylist.tasks";
const todoForm = document.querySelector("#todo-form");
const taskInput = document.querySelector("#task-input");
const todoList = document.querySelector("#todo-list");
const taskCount = document.querySelector("#task-count");
const progressTrack = document.querySelector("#progress-track");
const progressBar = document.querySelector("#progress-bar");
const progressLabel = document.querySelector("#progress-label");
const clearCompletedButton = document.querySelector("#clear-completed");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyDescription = document.querySelector("#empty-description");
const filterButtons = document.querySelectorAll(".filter-button");

let tasks = loadTasks();
let currentFilter = "all";

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat(undefined, {
	weekday: "long",
	month: "long",
	day: "numeric",
}).format(new Date());

function loadTasks() {
	try {
		const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
		if (!Array.isArray(savedTasks)) {
			return [];
		}

		return savedTasks.filter((task) =>
			task &&
			typeof task.id === "string" &&
			typeof task.text === "string" &&
			typeof task.completed === "boolean"
		);
	} catch {
		return [];
	}
}

function saveTasks() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskElement(task) {
	const item = document.createElement("li");
	item.className = "task-item";
	item.classList.toggle("is-complete", task.completed);

	const label = document.createElement("label");
	label.className = "task-main";

	const checkbox = document.createElement("input");
	checkbox.className = "task-checkbox";
	checkbox.type = "checkbox";
	checkbox.checked = task.completed;
	checkbox.dataset.action = "toggle";
	checkbox.dataset.taskId = task.id;
	checkbox.setAttribute(
		"aria-label",
		task.completed ? `Mark "${task.text}" as not complete` : `Mark "${task.text}" as complete`
	);

	const text = document.createElement("span");
	text.className = "task-text";
	text.textContent = task.text;

	const deleteButton = document.createElement("button");
	deleteButton.className = "delete-button";
	deleteButton.type = "button";
	deleteButton.dataset.action = "delete";
	deleteButton.dataset.taskId = task.id;
	deleteButton.textContent = "Delete";
	deleteButton.setAttribute("aria-label", `Delete "${task.text}"`);

	label.append(checkbox, text);
	item.append(label, deleteButton);
	return item;
}

function renderTasks() {
	const visibleTasks = tasks.filter((task) => {
		if (currentFilter === "active") {
			return !task.completed;
		}
		if (currentFilter === "completed") {
			return task.completed;
		}
		return true;
	});

	todoList.replaceChildren();
	visibleTasks.forEach((task) => todoList.append(createTaskElement(task)));

	const remainingCount = tasks.filter((task) => !task.completed).length;
	const completedCount = tasks.length - remainingCount;
	const progressPercentage = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

	taskCount.textContent = `${remainingCount} ${remainingCount === 1 ? "task" : "tasks"} left`;
	progressBar.style.width = `${progressPercentage}%`;
	progressTrack.setAttribute("aria-valuenow", String(progressPercentage));
	progressLabel.textContent = tasks.length === 0
		? "Ready when you are"
		: `${completedCount} of ${tasks.length} complete`;
	clearCompletedButton.disabled = completedCount === 0;

	filterButtons.forEach((button) => {
		button.setAttribute("aria-pressed", String(button.dataset.filter === currentFilter));
	});

	emptyState.hidden = visibleTasks.length > 0;
	if (tasks.length === 0) {
		emptyTitle.textContent = "No tasks yet";
		emptyDescription.textContent = "Add your first task to start the list.";
	} else if (currentFilter === "active") {
		emptyTitle.textContent = "No active tasks";
		emptyDescription.textContent = "Everything on your list is complete.";
	} else {
		emptyTitle.textContent = "No completed tasks";
		emptyDescription.textContent = "Completed tasks will show up here.";
	}
}

todoForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const text = taskInput.value.trim();
	if (text === "") {
		return;
	}

	const id = typeof window.crypto.randomUUID === "function"
		? window.crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	tasks.unshift({ id, text, completed: false });
	saveTasks();
	renderTasks();
	todoForm.reset();
	taskInput.focus();
});

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		currentFilter = button.dataset.filter;
		renderTasks();
	});
});

todoList.addEventListener("change", (event) => {
	const checkbox = event.target;
	if (!(checkbox instanceof HTMLInputElement) || checkbox.dataset.action !== "toggle") {
		return;
	}

	const task = tasks.find((item) => item.id === checkbox.dataset.taskId);
	if (!task) {
		return;
	}

	task.completed = checkbox.checked;
	saveTasks();
	renderTasks();

	const nextCheckbox = Array.from(todoList.querySelectorAll(".task-checkbox"))
		.find((item) => item.dataset.taskId === task.id);
	if (nextCheckbox) {
		nextCheckbox.focus();
	} else {
		document.querySelector(`[data-filter="${currentFilter}"]`).focus();
	}
});

todoList.addEventListener("click", (event) => {
	if (!(event.target instanceof Element)) {
		return;
	}

	const deleteButton = event.target.closest('button[data-action="delete"]');
	if (!deleteButton) {
		return;
	}

	tasks = tasks.filter((task) => task.id !== deleteButton.dataset.taskId);
	saveTasks();
	renderTasks();
	taskInput.focus();
});

clearCompletedButton.addEventListener("click", () => {
	tasks = tasks.filter((task) => !task.completed);
	saveTasks();
	renderTasks();
});

renderTasks();
