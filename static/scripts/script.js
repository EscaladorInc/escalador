import "../styles/styles.css";

console.log(
  "Checked: ",
  document.querySelector("input[name=type_selection]:checked")?.value
);

console.log("Rest days: ", document.getElementById("rest_input").value);
console.log("Work days: ", document.getElementById("work_input").value);

const deleteCalendarBtn = document.getElementById("delete_calendar");
deleteCalendarBtn.style.display = "none";
deleteCalendarBtn.onclick = deleteCalendar;

const createCalendarBtn = document.getElementById("create_calendar");
createCalendarBtn.style.display = "none";
createCalendarBtn.onclick = createSecondaryCalendar;

const createEventBtn = document.getElementById("create_event");
createEventBtn.style.visibility = "hidden";
createEventBtn.disabled = true;
createEventBtn.onclick = publishEvents;

const acceptBtn = document.getElementById("accept_button");
acceptBtn.onclick = createEvents;

const helpText = document.getElementById("help_text");
helpText.style.display = "none";

const helpButton = document.getElementById("help_button");
helpButton.onclick = showOrHideHelp;

const dateInput = document.getElementById("start_date");
dateInput.value = new Date().toISOString().slice(0, 10);

let hasCalendar = false;
let form;

let events = [];

function showOrHideHelp() {
  return helpText.style.display === "none"
    ? (helpText.style.display = "inline")
    : (helpText.style.display = "none");
}

function getForm() {
  const optionInput = document.querySelector(
    "input[name=type_selection]:checked"
  )?.value;
  const restInput = document.getElementById("rest_input")?.value;
  const workInput = document.getElementById("work_input")?.value;
  const startDate = new Date(
    `${document.getElementById("start_date")?.value} GMT-3`
  );
  const nextOptionInput = document.querySelector(
    "input[name=next_type_selection]:checked"
  )?.value;

  const date = new Date();

  if (restInput <= 0) {
    return window.alert("Dias de folga não pode ser menor ou igual 0!");
  } else if (workInput <= 0) {
    return window.alert("Dias de trabalho não pode ser menor ou igual 0!");
  } else if (startDate.getTime() < date.getTime()) {
    const day = startDate.getDay();
    const month = startDate.getMonth();
    const year = startDate.getFullYear();
    if (
      year < date.getFullYear() ||
      month < date.getMonth() ||
      (day < date.getDay() && month <= date.getMonth())
    ) {
      return window.alert("Data inválida!");
    }
  }

  form = {
    startDate,
    nextOptionInput,
    workInput,
    restInput,
    optionInput,
  };

  return true;
}

function transformDate(date) {
  const endOfYear = new Date(`${date.getFullYear()}-12-31 23:59:59 GMT-3`);
  const endOfYearTime = endOfYear.getTime();
  const nowTime = date.getTime();

  const daysToYearEnd = (endOfYearTime - nowTime) / 8.64e7;

  return { count: parseInt(daysToYearEnd), milli: nowTime };
}

function createEvents() {
  acceptBtn.disabled = true;

  events = [];
  if (!getForm()) {
    acceptBtn.disabled = false;
    return;
  }
  let { count, milli } = transformDate(form.startDate);

  let i = 0;

  while (i < count) {
    for (let workCount = 0; workCount < form.workInput; workCount++) {
      if (i >= count) break;
      const date = new Date(milli).toISOString().slice(0, 10);
      events.push({
        calendarId,
        summary: form.nextOptionInput === "work" ? "Trabalho" : "Folga",
        end: {
          date,
        },
        start: {
          date,
        },
      });
      milli += 8.64e7;
      i++;
    }
    for (let restCount = 0; restCount < form.restInput; restCount++) {
      if (i >= count) break;
      const date = new Date(milli).toISOString().slice(0, 10);
      events.push({
        calendarId,
        summary: form.nextOptionInput === "work" ? "Folga" : "Trabalho",
        end: {
          date,
        },
        start: {
          date,
        },
      });
      milli += 8.64e7;
      i++;
    }
  }

  console.log(events);
  createEventBtn.disabled = false;
  return (acceptBtn.disabled = false);
}

async function publishEvents() {
  createEventBtn.disabled = true;
  createEventBtn.style.cursor = "not-allowed";
  if (form.optionInput === "both") {
    for (const event of events) {
      await gapi.client.calendar.events.insert(event);
    }
  } else if (form.optionInput === "work") {
    const workEvents = events.filter((event) => event.summary === "Trabalho");
    for (const event of workEvents) {
      await gapi.client.calendar.events.insert(event);
    }
  } else {
    const restEvents = events.filter((event) => event.summary === "Folga");
    for (const event of restEvents) {
      await gapi.client.calendar.events.insert(event);
    }
  }
  window.alert("Eventos registrados com sucesso!");
  return await listUpcomingEvents();
}

async function createSecondaryCalendar() {
  deleteCalendarBtn.disabled = false;
  deleteCalendarBtn.style.cursor = "default";

  createCalendarBtn.disabled = true;
  createCalendarBtn.style.cursor = "not-allowed";

  try {
    await gapi.client.calendar.calendars.insert({
      summary: "Escalador",
    });
    createCalendarBtn.style.display = "none";
    await getCalendarList();
    return await listUpcomingEvents();
  } catch (error) {
    console.log(error);
  }
}

async function deleteCalendar() {
  deleteCalendarBtn.style.cursor = "not-allowed";
  deleteCalendarBtn.disabled = true;

  createCalendarBtn.disabled = false;
  createCalendarBtn.style.cursor = "default";

  try {
    await gapi.client.calendar.calendars.delete({ calendarId });
    deleteCalendarBtn.style.display = "none";
    createCalendarBtn.style.display = "inline";
    calendarId = "";
    await getCalendarList();
    return await listUpcomingEvents();
  } catch (error) {
    console.log(error);
  }
}
