export async function test(agenda) {
  agenda.define("tester-whatever", async (job) => {
    console.log("Running extended lot schedule job.");
  });
}
