export const runWorkflow = async ({ workflow, context }) => {
  for (const step of workflow.steps) {
    // check approver permission
    // notify approver
    // wait for approval
  }
};
