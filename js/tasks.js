// js/tasks.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { ref, push, set, remove, update, onValue } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const projectTitleInput = document.getElementById("project-title");
const projectDateInput = document.getElementById("project-date");
const addProjectBtn = document.getElementById("add-project-btn");
const logoutBtn = document.getElementById("logout-btn");
const userDisplayName = document.getElementById("user-display-name");
const userDisplayEmail = document.getElementById("user-display-email");
const userInitial = document.getElementById("user-initial");
const projectsContainer = document.getElementById("projects-container");

const taskNameInput = document.getElementById("task-name");
const taskDescInput = document.getElementById("task-desc");
const addTaskBtn = document.getElementById("add-task-btn");
const reportProjectSelect = document.getElementById("report-project-select");

let currentUser = null;
let activeProjectId = null;
let activeProjectName = "";
let barChartInstance = null;
let pieChartInstance = null;
let cachedProjectsData = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    const email = user.email || "user@email.com";
    const name = user.displayName || email.split('@')[0];
    
    userDisplayName.textContent = name;
    userDisplayEmail.textContent = email;
    userInitial.textContent = name.charAt(0).toUpperCase();

    loadProjects(user.uid);
  } else {
    window.location.href = "index.html";
  }
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
});

// Create Project
addProjectBtn.addEventListener("click", () => {
  const title = projectTitleInput.value.trim();
  const deadline = projectDateInput.value;
  if (!title || !currentUser) return;

  const projectsRef = ref(db, `users/${currentUser.uid}/projects`);
  const newProjectRef = push(projectsRef);

  set(newProjectRef, {
    title: title,
    deadline: deadline || "No Deadline",
    createdAt: Date.now()
  }).then(() => {
    projectTitleInput.value = "";
    projectDateInput.value = "";
  });
});

// Load Projects
function loadProjects(uid) {
  const projectsRef = ref(db, `users/${uid}/projects`);
  
  onValue(projectsRef, (snapshot) => {
    const data = snapshot.val();
    cachedProjectsData = data;
    projectsContainer.innerHTML = "";
    reportProjectSelect.innerHTML = `<option value="all">All Projects</option>`;

    if (!data) return;

    Object.keys(data).forEach((projectId) => {
      const project = data[projectId];
      const card = document.createElement("div");
      card.className = "proj-card";
      card.innerHTML = `
        <div class="proj-card-content">
            <h4>${project.title}</h4>
            <p>Deadline: ${project.deadline}</p>
        </div>
        <div class="proj-card-actions">
            <button class="open-btn" onclick="window.openProject('${projectId}', '${project.title.replace(/'/g, "\\'")}')">Open</button>
            <button class="delete-btn" onclick="window.deleteProject('${projectId}')">Delete</button>
        </div>
      `;
      projectsContainer.appendChild(card);

      const option = document.createElement("option");
      option.value = projectId;
      option.textContent = project.title;
      reportProjectSelect.appendChild(option);
    });
  });
}

window.deleteProject = function(projectId) {
  if (!currentUser) return;
  const projectRef = ref(db, `users/${currentUser.uid}/projects/${projectId}`);
  remove(projectRef);
};

window.openProject = function(projectId, projectName) {
  activeProjectId = projectId;
  activeProjectName = projectName;

  document.getElementById("projects-view").style.display = "none";
  document.getElementById("tasks-view").style.display = "block";
  document.getElementById("reports-view").style.display = "none";

  document.getElementById("page-header-title").textContent = "Tasks";
  document.getElementById("active-project-title").textContent = projectName;
  
  document.getElementById("menu-projects").classList.remove("active");
  document.getElementById("menu-tasks").classList.add("active");
  document.getElementById("menu-reports").classList.remove("active");

  loadProjectTasks(currentUser.uid, projectId);
};

window.showProjectsView = function() {
  activeProjectId = null;
  document.getElementById("tasks-view").style.display = "none";
  document.getElementById("reports-view").style.display = "none";
  document.getElementById("projects-view").style.display = "block";

  document.getElementById("page-header-title").textContent = "Projects";
  
  document.getElementById("menu-tasks").classList.remove("active");
  document.getElementById("menu-reports").classList.remove("active");
  document.getElementById("menu-projects").classList.add("active");
};

window.showReportsView = function() {
  activeProjectId = null;
  document.getElementById("projects-view").style.display = "none";
  document.getElementById("tasks-view").style.display = "none";
  document.getElementById("reports-view").style.display = "block";

  document.getElementById("page-header-title").textContent = "Reports & Analytics";
  
  document.getElementById("menu-projects").classList.remove("active");
  document.getElementById("menu-tasks").classList.remove("active");
  document.getElementById("menu-reports").classList.add("active");

  window.filterReportsByProject(reportProjectSelect.value);
};

window.filterReportsByProject = function(selectedProjId) {
  if (!cachedProjectsData) {
    renderCharts(0, 0, 0);
    return;
  }

  let totalTodo = 0;
  let totalInProgress = 0;
  let totalDone = 0;

  if (selectedProjId === "all") {
    Object.keys(cachedProjectsData).forEach((projId) => {
      const proj = cachedProjectsData[projId];
      if (proj.tasks) {
        Object.keys(proj.tasks).forEach((taskId) => {
          const task = proj.tasks[taskId];
          if (task.status === "todo") totalTodo++;
          else if (task.status === "inprogress") totalInProgress++;
          else if (task.status === "done") totalDone++;
        });
      }
    });
  } else {
    const proj = cachedProjectsData[selectedProjId];
    if (proj && proj.tasks) {
      Object.keys(proj.tasks).forEach((taskId) => {
        const task = proj.tasks[taskId];
        if (task.status === "todo") totalTodo++;
        else if (task.status === "inprogress") totalInProgress++;
        else if (task.status === "done") totalDone++;
      });
    }
  }

  renderCharts(totalTodo, totalInProgress, totalDone);
};

addTaskBtn.addEventListener("click", () => {
  const title = taskNameInput.value.trim();
  const desc = taskDescInput.value.trim();

  if (!title || !currentUser || !activeProjectId) return;

  const tasksRef = ref(db, `users/${currentUser.uid}/projects/${activeProjectId}/tasks`);
  const newTaskRef = push(tasksRef);

  set(newTaskRef, {
    title: title,
    description: desc,
    status: "todo",
    createdAt: Date.now()
  }).then(() => {
    taskNameInput.value = "";
    taskDescInput.value = "";
  });
});

function loadProjectTasks(uid, projId) {
  const tasksRef = ref(db, `users/${uid}/projects/${projId}/tasks`);

  onValue(tasksRef, (snapshot) => {
    const data = snapshot.val();
    
    const todoList = document.getElementById("todo-list");
    const inprogressList = document.getElementById("inprogress-list");
    const doneList = document.getElementById("done-list");

    todoList.innerHTML = "";
    inprogressList.innerHTML = "";
    doneList.innerHTML = "";

    let todoCount = 0, inprogressCount = 0, doneCount = 0;

    if (!data) {
      document.getElementById("todo-count").textContent = 0;
      document.getElementById("inprogress-count").textContent = 0;
      document.getElementById("done-count").textContent = 0;
      return;
    }

    Object.keys(data).forEach((taskId) => {
      const task = data[taskId];
      const card = document.createElement("div");
      card.className = "task-item-card";
      card.id = taskId;
      card.draggable = true;
      card.ondragstart = (ev) => { ev.dataTransfer.setData("text/plain", taskId); };

      card.innerHTML = `
        <div class="task-info">
            <h4>${task.title}</h4>
            <p>${task.description || "No description"}</p>
        </div>
        <div class="task-item-actions">
            <span class="drag-handle" title="Drag me">⠿</span>
            <button class="task-del-btn" onclick="window.deleteTask('${taskId}')">❌</button>
        </div>
      `;

      if (task.status === "todo") {
        todoList.appendChild(card);
        todoCount++;
      } else if (task.status === "inprogress") {
        inprogressList.appendChild(card);
        inprogressCount++;
      } else if (task.status === "done") {
        doneList.appendChild(card);
        doneCount++;
      }
    });

    document.getElementById("todo-count").textContent = todoCount;
    document.getElementById("inprogress-count").textContent = inprogressCount;
    document.getElementById("done-count").textContent = doneCount;
  });
}

function renderCharts(todo, inprogress, done) {
  const barCtx = document.getElementById('taskBarChart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy();

  barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['To Do', 'In Progress', 'Done'],
      datasets: [{
        label: 'Number of Tasks',
        data: [todo, inprogress, done],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });

  const pieCtx = document.getElementById('taskPieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['To Do', 'In Progress', 'Done'],
      datasets: [{
        data: [todo, inprogress, done],
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

window.deleteTask = function(taskId) {
  if (!currentUser || !activeProjectId) return;
  const taskRef = ref(db, `users/${currentUser.uid}/projects/${activeProjectId}/tasks/${taskId}`);
  remove(taskRef);
};

window.updateTaskStatusByDrag = function(taskId, newStatus) {
  if (!currentUser || !activeProjectId) return;
  const taskRef = ref(db, `users/${currentUser.uid}/projects/${activeProjectId}/tasks/${taskId}`);
  update(taskRef, { status: newStatus });
};