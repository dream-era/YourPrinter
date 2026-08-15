import { Inngest } from "inngest";
import { env } from "@/lib/env";

export const inngest = new Inngest({
  id: "my-printer",
  eventKey: env.INNGEST_EVENT_KEY,
});

export const processPrintJobFunction = inngest.createFunction(
  { id: "process-print-job" },
  { event: "printer/job.submitted" },
  async ({ event, step }) => {
    await step.run("convert-document-to-ps", async () => {
      return { status: "converted", fileKey: event.data.fileKey };
    });

    await step.run("dispatch-to-printer-spooler", async () => {
      return { status: "dispatched", printerId: event.data.printerId };
    });

    return { message: "Print job processed successfully!" };
  }
);
