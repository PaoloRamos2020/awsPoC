const projects = [
  {
    id: "PRJ-001",
    name: "Modernización Core Bancario",
    status: "En Progreso",
    priority: "Alta",
    team: "T&I",
    owner: "Pablo Vela",
    budget: 450000,
    progress: 65
  },
  {
    id: "PRJ-002", 
    name: "Plataforma Digital Retail",
    status: "Planificación",
    priority: "Alta",
    team: "Digital",
    owner: "María Torres",
    budget: 280000,
    progress: 20
  },
  {
    id: "PRJ-003",
    name: "Migración Cloud AWS",
    status: "En Progreso",
    priority: "Media",
    team: "T&I",
    owner: "Carlos Ruiz",
    budget: 320000,
    progress: 45
  },
  {
    id: "PRJ-004",
    name: "Sistema Anti-Fraude ML",
    status: "En Progreso",
    priority: "Alta",
    team: "Data & Analytics",
    owner: "Ana Gutierrez",
    budget: 195000,
    progress: 80
  },
  {
    id: "PRJ-005",
    name: "Portal Corporativo B2B",
    status: "Pendiente",
    priority: "Baja",
    team: "Digital",
    owner: "Luis Mendez",
    budget: 120000,
    progress: 0
  },
  {
    id: "PRJ-006",
    name: "Integración Open Banking",
    status: "Planificación",
    priority: "Media",
    team: "T&I",
    owner: "Sofia Castro",
    budget: 210000,
    progress: 10
  }
];

exports.handler = async (event) => {
  const now = new Date().toISOString();
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      source: "jira-mock",
      timestamp: now,
      total: projects.length,
      projects: projects
    })
  };
};
