/**
 * WORKFLOWS PAGE
 * Purpose: Presents workflow runs, coverage requests, and assignment pressure for operators and supervisors.
 * Role: Makes orchestration state observable instead of hidden inside background jobs.
 */
import Link from 'next/link';
import { listDashboardAssignments, listDashboardCoverageRequests, listDashboardEscalations, listDashboardWorkflows } from '../../lib/api';

/**
 * FUNCTION: WorkflowsPage
 * Inputs: none.
 * Outputs: React server component.
 * Functionality: Renders workflow, coverage, and assignment state using API-backed dashboard accessors.
 * External calls: listDashboardWorkflows(), listDashboardCoverageRequests(), and listDashboardAssignments() read backend API or fallback rows.
 */
export default async function WorkflowsPage() {
  const [workflows, coverageRequests, assignments, escalations] = await Promise.all([
    listDashboardWorkflows(),
    listDashboardCoverageRequests(),
    listDashboardAssignments(),
    listDashboardEscalations(),
  ]);

  return (
    <main className="shell">
      <section className="hero compact">
        <p className="eyebrow">Workflow Operations</p>
        <h1>Orchestration Visibility</h1>
        <p className="lede">Track workflow execution, coverage requests, and assignment outcomes from one surface.</p>
      </section>

      <section className="workspace two-column">
        <article className="panel">
          <header className="panel-header"><div><p className="eyebrow">Runs</p><h2>Workflow Queue</h2></div></header>
          <div className="table">
            {workflows.map((workflow) => (
              <div className="table-row" key={workflow.workflowRunId}>
                <Link href={`/workflows/${workflow.workflowRunId}`}>{workflow.workflowRunId.slice(0, 12)}</Link>
                <span>{workflow.status}</span>
                <span>{workflow.currentStep ?? 'started'}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <header className="panel-header"><div><p className="eyebrow">Coverage</p><h2>Coverage Requests</h2></div></header>
          <div className="table">
            {coverageRequests.map((request) => (
              <div className="table-row" key={request.coverageRequestId}>
                <span>{request.requiredRole}</span>
                <span>{request.status}</span>
                <span>{request.urgency}</span>
                <span>{new Date(request.coverageDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <header className="panel-header"><div><p className="eyebrow">Assignments</p><h2>Candidate Outreach</h2></div></header>
        <div className="data-table">
          <div className="data-row heading"><span>Assignment</span><span>Event</span><span>Personnel</span><span>Status</span><span>Created</span></div>
          {assignments.map((assignment) => (
            <div className="data-row" key={assignment.assignmentId}>
              <strong>{assignment.assignmentId.slice(0, 12)}</strong>
              <span>{assignment.operationalEventId.slice(0, 12)}</span>
              <span>{assignment.personnelId?.slice(0, 12) ?? 'Unassigned'}</span>
              <span className="status-pill">{assignment.status}</span>
              <span>{new Date(assignment.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel warning-panel">
        <header className="panel-header"><div><p className="eyebrow">Supervisor Escalations</p><h2>Manual Control Queue</h2></div><span className="status-pill">{escalations.length} active</span></header>
        <div className="data-table">
          <div className="data-row heading"><span>Escalation</span><span>Event</span><span>Level</span><span>Status</span><span>Reason</span></div>
          {escalations.map((escalation) => (
            <div className="data-row" key={escalation.escalationId}>
              <strong>{escalation.escalationId.slice(0, 12)}</strong>
              <span>{escalation.operationalEventId.slice(0, 12)}</span>
              <span>{escalation.level}</span>
              <span className="status-pill">{escalation.status}</span>
              <span>{escalation.reason}</span>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
