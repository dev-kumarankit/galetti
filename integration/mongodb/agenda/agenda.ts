import { Agenda } from "agenda/es";
import { initializeJobs } from "./jobs/jobs";

let agendaInstance: any = null;

async function initializeAgenda(mongooseConnection) {
  const agenda = new Agenda({
    mongo: mongooseConnection,
    db: {
      collection: "agenda_jobs",
    },
    // lockLimit: 1,
  });

  console.info("Setting up agenda jobs...");
  await initializeJobs(agenda);
  console.info("Finished setting up agenda jobs...");

  agenda.on("start", (job) => {
    console.log("Job %s starting...", job.attrs.name);
  });
  agenda.on("complete", (job) => {
    console.log(`Job ${job.attrs.name} has finished...`);
  });
  agenda.on("fail", (err, job) => {
    console.log(`Job failed with error: ${err.message}`);
  });

  await agenda.start();

  agendaInstance = agenda;

  console.info("Successfully started agenda!");
}

export { initializeAgenda, agendaInstance };
