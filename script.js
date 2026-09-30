// select the html elements used
const form = document.querySelector('#task-form');
const input = document.querySelector('#task-input');
const inputLabel = document.querySelector('#input-label');
const submitButton = document.querySelector('#submit-button');
const cancelButton = document.querySelector('#cancel-button');

const list = document.querySelector('#task-list');
const counter = document.querySelector('#counter');
const emptyState = document.querySelector('#empty-state');

const message = document.querySelector('#message');
const storageMessage = document.querySelector('#storage-message');

// define the key used to save tasks in localStorage
const STORAGE_KEY = 'my-pink-todo-tasks';

// load saved tasks when the application starts
let tasks = loadTasks();

// store the ID of the task being edited, or null when adding
let editingId = null;

// start with the highest saved ID to avoid duplicate task IDs
let nextId = tasks.reduce(
  (largest, task) => task.id > largest ? task.id : largest,
  0
) + 1;

// read saved tasks and recover if loading fails
function loadTasks() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY); // get the saved tasks
    const savedTasks = JSON.parse(savedText) || []; // retransforme the texte to javascript

    if (!Array.isArray(savedTasks)) {
      throw new Error('Saved tasks must be an array.');
    }

    return savedTasks;
  } catch (error) {
    console.warn('Could not load tasks:', error);

    storageMessage.textContent =
      'Saved tasks could not be loaded. Starting with an empty list.';

    return [];
  }
}

// save the current task array in the browser
function saveTasks() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(tasks) // transforme the array (javascript) to text
    );

    storageMessage.textContent = '';
  } catch (error) {
    console.warn('Could not save tasks:', error);

    storageMessage.textContent =
      'Your changes could not be saved in this browser.';
  }
}

// save the data and update the displayed list
function updateTasks() {
  saveTasks();
  renderTasks();
}

// create an action button with a symbol and an label
function createButton(className, symbol, label) {
  const button = document.createElement('button');

  button.type = 'button';
  button.classList.add(className);
  button.textContent = symbol;

  button.setAttribute('aria-label', label);
  button.setAttribute('title', label);

  return button;
}

// build one list item from one task object
function taskToListItem(task) {
  const li = document.createElement('li');

  li.classList.add('task');
  li.classList.toggle('done', task.done);
  li.classList.toggle('editing', task.id === editingId);
  li.dataset.id = task.id;

  const toggleButton = createButton(
    'toggle',
    task.done ? '✓' : '',
    'Mark task as complete or incomplete'
  );

  toggleButton.setAttribute('aria-pressed', task.done);

  const title = document.createElement('span');
  title.classList.add('task-title');
  title.textContent = task.title;

  const editButton = createButton(
    'edit',
    '✎',
    'Edit task'
  );

  const deleteButton = createButton(
    'delete',
    '×',
    'Delete task'
  );

  li.append(toggleButton, title, editButton, deleteButton);

  return li;
}

// show all the task array and update the counter
function renderTasks() {
  list.innerHTML = '';

  tasks
    .map(taskToListItem)
    .forEach(li => list.append(li));

  const doneCount = tasks.reduce(
    (count, task) => task.done ? count + 1 : count,
    0
  );

  counter.textContent = `${doneCount} of ${tasks.length} done`;

  emptyState.hidden = tasks.length !== 0;
}

// add new task with a unique ID
function addTask(title) {
  tasks = [
    ...tasks,
    { id: nextId, title: title, done: false }
  ];

  nextId = nextId + 1;
  updateTasks();
}

// remove the task with the same ID
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);

  if (editingId === id) {
    resetForm();
  }

  updateTasks();
}

// switch the completion state of the repeated task
function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id
      ? { ...task, done: !task.done }
      : task
  );

  updateTasks();
}

// put the selected task into the form for editing
function startEditing(id) {
  tasks.forEach(task => {
    if (task.id === id) {
      editingId = id;
      input.value = task.title;
    }
  });

  inputLabel.textContent = 'Edit task';
  submitButton.textContent = '✓ Save';
  cancelButton.hidden = false;

  message.textContent = '';
  input.removeAttribute('aria-invalid');

  renderTasks();
  input.focus();
}

// update the title while keeping the other task also
function editTask(id, title) {
  tasks = tasks.map(task =>
    task.id === id
      ? { ...task, title: title }
      : task
  );

  updateTasks();
}

// return the form to the original add-task mode
function resetForm() {
  editingId = null;

  input.value = '';
  inputLabel.textContent = 'New task';
  submitButton.textContent = '+ Add task';

  cancelButton.hidden = true;
  message.textContent = '';

  input.removeAttribute('aria-invalid');
}

// cancel editing without changing the saved task
function cancelEditing() {
  resetForm();
  renderTasks();
  input.focus();
}

// confirm the input and then add a task or save anu updates
function handleSubmit(event) {
  event.preventDefault();

  const title = input.value.trim();

  if (title === '') {
    message.textContent = 'Please enter a task.';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }

  const id = editingId;
  resetForm();

  if (id === null) {
    addTask(title);
  } else {
    editTask(id, title);
  }

  input.focus();
}

// identify the clicked button of the array
function handleListClick(event) {
  const li = event.target.closest('li');

  if (!li) {
    return;
  }

  const id = Number(li.dataset.id);

  if (event.target.closest('.delete')) {
    deleteTask(id);
  } else if (event.target.closest('.edit')) {
    startEditing(id);
  } else if (event.target.closest('.toggle')) {
    toggleTask(id);
  }
}

// form is submitted when we click on add task or save
form.addEventListener('submit', handleSubmit);

// handle clicks on task action buttons
list.addEventListener('click', handleListClick);

// allow user to cancel the edit
cancelButton.addEventListener('click', cancelEditing);

// display saved tasks when the page opens
renderTasks();