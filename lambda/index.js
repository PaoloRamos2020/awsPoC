const MOCK_PROJECTS = [
  { key: "GDP-001", summary: "Migración Core Bancario - Módulo Pagos", priority: "High", status: "To Do", points: 34, squad: "Core Banking", quarter: "Q2-2026" },
  { key: "GDP-002", summary: "API Open Banking - PSD2 Compliance", priority: "Critical", status: "In Progress", points: 55, squad: "Integrations", quarter: "Q2-2026" },
  { key: "GDP-003", summary: "Dashboard Analytics Ejecutivo", priority: "Medium", status: "In Progress", points: 21, squad: "Data & AI", quarter: "Q1-2026" },
  { key: "GDP-004", summary: "Renovación App Mobile - Expo SDK 52", priority: "High", status: "Done", points: 89, squad: "Mobile", quarter: "Q1-2026" },
  { key: "GDP-005", summary: "Automatización RPA - Conciliación SAP", priority: "Medium", status: "To Do", points: 13, squad: "Automation", quarter: "Q3-2026" },
  { key: "GDP-006", summary: "Plataforma CI/CD Corporativa", priority: "High", status: "In Progress", points: 34, squad: "DevSecOps", quarter: "Q2-2026" },
];

exports.handler = async (event) => {
  const action = event.queryStringParameters?.action || "list";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "X-Mock-Source": "JIRA-Lambda-Mock",
  };

  if (action === "list") {
    return { statusCode: 200, headers, body: JSON.stringify({ issues: MOCK_PROJECTS, total: MOCK_PROJECTS.length }) };
  }

  if (action === "webhook") {
    const randomIssue = MOCK_PROJECTS[Math.floor(Math.random() * MOCK_PROJECTS.length)];
    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        webhookEvent: "jira:issue_updated",
        timestamp: new Date().toISOString(),
        issue: randomIssue,
      }),
    };
  }

  return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
};
