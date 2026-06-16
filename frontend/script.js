/*
  LOCAL DEVELOPMENT

  When the frontend runs through Nginx on:

  http://localhost:8080

  requests to /api/ will be forwarded by Nginx
  to the Django backend container.
*/

const LOCAL_API_URL = "/api/tasks/";

/*
  RENDER

  Later, replace this address with the real URL
  of your backend service on Render.

  Example:

  https://todo-backend.onrender.com/api/tasks/
*/

const RENDER_API_URL =
  "https://project-dockerized-application-backend.onrender.com/api/tasks/";

const isLocalEnvironment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_URL = isLocalEnvironment ? LOCAL_API_URL : RENDER_API_URL;

/*
  HTML elements
*/

const taskForm = document.getElementById("task-form");

const taskTitleInput = document.getElementById("task-title");

const addTaskButton = document.getElementById("add-task-button");

const refreshButton = document.getElementById("refresh-button");

const taskList = document.getElementById("task-list");

const totalTasksElement = document.getElementById("total-tasks");

const completedTasksElement = document.getElementById("completed-tasks");

const openTasksElement = document.getElementById("open-tasks");

const formErrorElement = document.getElementById("form-error");

/*
  Store the tasks currently loaded from Django.
*/

let tasks = [];

/*
  Display an error under the create-task form.
*/

function showFormError(message) {
  formErrorElement.textContent = message;
  formErrorElement.hidden = false;
}

/*
  Hide the form error.
*/

function hideFormError() {
  formErrorElement.textContent = "";
  formErrorElement.hidden = true;
}

/*
  Format the date received from Django.
*/

function formatTaskDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleString();
}

/*
  Update dashboard numbers.
*/

function updateDashboard() {
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter((task) => task.completed).length;

  const openTasks = totalTasks - completedTasks;

  totalTasksElement.textContent = totalTasks;

  completedTasksElement.textContent = completedTasks;

  openTasksElement.textContent = openTasks;
}

/*
  Display a loading message.
*/

function showLoadingMessage() {
  taskList.innerHTML = "";

  const message = document.createElement("li");

  message.className = "loading-message";
  message.textContent = "Loading tasks...";

  taskList.appendChild(message);
}

/*
  Display a general API error.
*/

function showTasksError(message) {
  taskList.innerHTML = "";

  const errorItem = document.createElement("li");

  errorItem.className = "error-message";
  errorItem.textContent = message;

  taskList.appendChild(errorItem);
}

/*
  Create one task element.
*/

function createTaskElement(task) {
  const taskItem = document.createElement("li");

  taskItem.className = "task-item";

  if (task.completed) {
    taskItem.classList.add("completed");
  }

  const taskContent = document.createElement("div");

  taskContent.className = "task-content";

  const taskTitle = document.createElement("span");

  taskTitle.className = "task-title";
  taskTitle.textContent = task.title;

  const taskDate = document.createElement("span");

  taskDate.className = "task-date";
  taskDate.textContent = formatTaskDate(task.created_at);

  taskContent.appendChild(taskTitle);
  taskContent.appendChild(taskDate);

  const taskActions = document.createElement("div");

  taskActions.className = "task-actions";

  const toggleButton = document.createElement("button");

  toggleButton.type = "button";

  toggleButton.className = "action-button toggle-button";

  toggleButton.textContent = task.completed ? "Reopen" : "Complete";

  toggleButton.addEventListener("click", () => toggleTask(task, toggleButton));

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";

  deleteButton.className = "action-button delete-button";

  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () =>
    deleteTask(task.id, deleteButton),
  );

  taskActions.appendChild(toggleButton);
  taskActions.appendChild(deleteButton);

  taskItem.appendChild(taskContent);
  taskItem.appendChild(taskActions);

  return taskItem;
}

/*
  Render all tasks.
*/

function renderTasks() {
  taskList.innerHTML = "";

  updateDashboard();

  if (tasks.length === 0) {
    const emptyItem = document.createElement("li");

    emptyItem.className = "empty-message";

    emptyItem.textContent = "No tasks yet. Add your first one above.";

    taskList.appendChild(emptyItem);

    return;
  }

  tasks.forEach((task) => {
    const taskElement = createTaskElement(task);

    taskList.appendChild(taskElement);
  });
}

/*
  Check that a response from Django succeeded.
*/

async function validateResponse(response) {
  if (response.ok) {
    return;
  }

  let errorMessage = `Request failed with status ${response.status}.`;

  try {
    const errorData = await response.json();

    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (errorData.title) {
      errorMessage = Array.isArray(errorData.title)
        ? errorData.title.join(" ")
        : errorData.title;
    }
  } catch (error) {
    console.error("Could not read the API error response:", error);
  }

  throw new Error(errorMessage);
}

/*
  Load all tasks from Django.

  Expected request:

  GET /api/tasks/
*/

async function loadTasks() {
  showLoadingMessage();

  refreshButton.disabled = true;

  try {
    const response = await fetch(API_URL);

    await validateResponse(response);

    const data = await response.json();

    /*
      Supports both:

      [
        {...},
        {...}
      ]

      and a paginated DRF response:

      {
        "count": 2,
        "results": [
          {...},
          {...}
        ]
      }
    */

    tasks = Array.isArray(data) ? data : data.results || [];

    renderTasks();
  } catch (error) {
    console.error("Could not load tasks:", error);

    tasks = [];

    updateDashboard();

    showTasksError(`Could not load tasks. ${error.message}`);
  } finally {
    refreshButton.disabled = false;
  }
}

/*
  Create a new task.

  Expected request:

  POST /api/tasks/

  Body:

  {
    "title": "New task"
  }
*/

async function createTask(title) {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      title: title,
    }),
  });

  await validateResponse(response);

  return response.json();
}

/*
  Toggle completed / open status.

  Expected request:

  PATCH /api/tasks/1/

  Body:

  {
    "completed": true
  }
*/

async function toggleTask(task, button) {
  button.disabled = true;

  try {
    const response = await fetch(`${API_URL}${task.id}/`, {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        completed: !task.completed,
      }),
    });

    await validateResponse(response);

    const updatedTask = await response.json();

    tasks = tasks.map((currentTask) =>
      currentTask.id === updatedTask.id ? updatedTask : currentTask,
    );

    renderTasks();
  } catch (error) {
    console.error("Could not update task:", error);

    window.alert(`Could not update the task. ${error.message}`);

    button.disabled = false;
  }
}

/*
  Delete a task.

  Expected request:

  DELETE /api/tasks/1/
*/

async function deleteTask(taskId, button) {
  const shouldDelete = window.confirm(
    "Are you sure you want to delete this task?",
  );

  if (!shouldDelete) {
    return;
  }

  button.disabled = true;

  try {
    const response = await fetch(`${API_URL}${taskId}/`, {
      method: "DELETE",
    });

    await validateResponse(response);

    tasks = tasks.filter((task) => task.id !== taskId);

    renderTasks();
  } catch (error) {
    console.error("Could not delete task:", error);

    window.alert(`Could not delete the task. ${error.message}`);

    button.disabled = false;
  }
}

/*
  Submit the Add Task form.
*/

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  hideFormError();

  const title = taskTitleInput.value.trim();

  if (!title) {
    showFormError("Please enter a task title.");

    return;
  }

  addTaskButton.disabled = true;
  taskTitleInput.disabled = true;

  try {
    const newTask = await createTask(title);

    tasks.unshift(newTask);

    renderTasks();

    taskForm.reset();
    taskTitleInput.focus();
  } catch (error) {
    console.error("Could not create task:", error);

    showFormError(`Could not add the task. ${error.message}`);
  } finally {
    addTaskButton.disabled = false;
    taskTitleInput.disabled = false;
  }
});

/*
  Refresh button.
*/

refreshButton.addEventListener("click", loadTasks);

/*
  Load tasks when the page opens.
*/

loadTasks();
