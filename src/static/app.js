document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  fetchActivities();

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    messageDiv.classList.remove("hidden", "success", "error");
    messageDiv.textContent = "Signing up...";

    try {
      if (!activity) throw new Error("Please select an activity");
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.message || "Signup failed");

      // Update local model and UI
      window.activities = window.activities || {};
      if (window.activities[activity]) {
        window.activities[activity].participants.push(email);
        renderActivities(window.activities);
      } else {
        await fetchActivities(); // fallback
      }

      messageDiv.classList.add("success");
      messageDiv.textContent = data.message;
    } catch (err) {
      messageDiv.classList.add("error");
      messageDiv.textContent = err.message || "Error signing up";
    } finally {
      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    const response = await fetch("/activities");
    const data = await response.json();
    window.activities = data;
    renderActivities(data);
    populateSelect(data);
  }

  function renderActivities(data) {
    activitiesList.innerHTML = "";
    if (!Object.keys(data).length) {
      activitiesList.innerHTML = "<p>No activities found.</p>";
      return;
    }

    for (const [name, info] of Object.entries(data)) {
      const card = document.createElement("div");
      card.className = "activity-card";

      const title = document.createElement("h4");
      title.textContent = name;
      card.appendChild(title);

      const desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = info.description;
      card.appendChild(desc);

      const schedule = document.createElement("p");
      schedule.className = "schedule";
      schedule.textContent = info.schedule;
      card.appendChild(schedule);

      const capacity = document.createElement("p");
      capacity.className = "capacity";
      capacity.textContent = `Participants: ${info.participants.length}/${info.max_participants}`;
      card.appendChild(capacity);

      // Participants section
      const participantsWrap = document.createElement("div");
      participantsWrap.className = "participants";

      const participantsTitle = document.createElement("h5");
      participantsTitle.textContent = "Participants";
      participantsWrap.appendChild(participantsTitle);

      const ul = document.createElement("ul");
      ul.className = "participants-list";

      if (!info.participants.length) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No participants yet.";
        ul.appendChild(li);
      } else {
        for (const p of info.participants) {
          const li = document.createElement("li");

          const avatar = document.createElement("span");
          avatar.className = "avatar";
          avatar.textContent = (p[0] || "?").toUpperCase();

          const emailSpan = document.createElement("span");
          emailSpan.className = "email";
          emailSpan.textContent = p;

          li.appendChild(avatar);
          li.appendChild(emailSpan);
          ul.appendChild(li);
        }
      }

      participantsWrap.appendChild(ul);
      card.appendChild(participantsWrap);
      activitiesList.appendChild(card);
    }
  }

  function populateSelect(data) {
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    for (const name of Object.keys(data)) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    }
  }
});
