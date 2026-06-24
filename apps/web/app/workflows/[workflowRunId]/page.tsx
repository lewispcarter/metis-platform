/**
 * WORKFLOW DETAIL PAGE
 * Purpose: Shows the task-level operational timeline for a workflow run.
 * Role: Gives operators and supervisors a single place to inspect orchestration progress, failures, and manual control paths.
 */
import { listDashboardWorkflowTasks } from '../../../lib/api';

/**
 * FUNCTION: WorkflowDetailPage
 * Inputs: Next.js dynamic route params containing workflowRunId.
 * Outputs: React server component.
 * Functionality: Renders workflow task checkpoints as an operational timeline.
 * External calls: listDashboardWorkflowTasks(workflowRunId) reads backend API or safe fallback checkpoints.
 */
type PageProps = {
  params: Promise<{
    workflowRunId: string;
  }>;
};

export default async function WorkflowDetailPage({ params }: PageProps) {
  const { workflowRunId } = await params;
  const tasks = await listDashboardWorkflowTasks(workflowRunId);

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Workflow Timeline</p>
        <h1>{workflowRunId.slice(0, 12)}</h1>
        <p className="lede">Task checkpoints expose exactly where orchestration is running, waiting, completed, or failed.</p>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div><p className="eyebrow">Execution</p><h2>Task Timeline</h2></div>
          <span className="status-pill">{tasks.length} checkpoints</span>
        </header>
        <div className="timeline">
          {tasks.map((task) => (
            <article className="timeline-item" key={task.workflowTaskId}>
              <div>
                <strong>{task.name}</strong>
                <p>{task.failureReason ?? `Status: ${task.status}`}</p>
              </div>
              <span className={`status-pill ${task.status.toLowerCase()}`}>{task.status}</span>
              <small>{new Date(task.updatedAt).toLocaleString()}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel warning-panel">
        <header className="panel-header"><div><p className="eyebrow">Supervisor Controls</p><h2>Manual Intervention Surface</h2></div></header>
        <p className="lede small">Force escalation, pause workflows, reassign ownership, or resolve stuck tasks through authenticated API controls. Buttons are intentionally read-only until authenticated dashboard actions are enabled.</p>
        <div className="action-row">
          <button className="button secondary" type="button">Force Escalation</button>
          <button className="button secondary" type="button">Reassign Owner</button>
          <button className="button secondary" type="button">Mark Reviewed</button>
        </div>
      </section>
    </main>
  );
}
