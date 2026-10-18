import dagre from "dagre";
import { Node, Edge } from "reactflow";
import { GraphNodeDTO, GraphEdgeDTO, OntologyLabelMeta } from "../types/api";

const NODE_WIDTH = 210;
const NODE_HEIGHT = 68;

export function getLayoutedElements(
  nodesDTO: GraphNodeDTO[],
  edgesDTO: GraphEdgeDTO[],
  ontologyMetas: OntologyLabelMeta[],
  direction: "LR" | "TB" = "LR",
  decisionOutcome?: "APPROVED" | "DENIED" | string
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Generous spacing so nodes and edge labels never collide
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 70,
    ranksep: 140,
    align: "UL",
  });

  const metaMap = new Map<string, OntologyLabelMeta>();
  for (const m of ontologyMetas) {
    metaMap.set(m.label, m);
  }

  // Add nodes to Dagre
  for (const node of nodesDTO) {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add edges to Dagre
  for (const edge of edgesDTO) {
    dagreGraph.setEdge(edge.source, edge.target);
  }

  dagre.layout(dagreGraph);

  const highlightColor = decisionOutcome === "DENIED" ? "#f43f5e" : "#10b981";

  const nodes: Node[] = nodesDTO.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const meta = metaMap.get(node.label) || {
      color: "#475569",
      border_color: "#334155",
      description: "",
      label: node.label,
    };

    return {
      id: node.id,
      type: "ontologyNode",
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - NODE_WIDTH / 2 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - NODE_HEIGHT / 2 : 0,
      },
      data: {
        label: node.name,
        dto: node,
        meta,
        highlightColor,
      },
    };
  });

  const edges: Edge[] = edgesDTO.map((edge) => {
    const isEdgeHighlighted = edge.highlighted;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.relation,
      type: "smoothstep",
      animated: isEdgeHighlighted,
      style: {
        stroke: isEdgeHighlighted
          ? decisionOutcome === "DENIED"
            ? "#f43f5e"
            : "#059669"
          : "#cbd5e1",
        strokeWidth: isEdgeHighlighted ? 2.5 : 1.5,
      },
      labelStyle: {
        fontSize: 10,
        fontWeight: 500,
        fill: isEdgeHighlighted
          ? decisionOutcome === "DENIED"
            ? "#e11d48"
            : "#047857"
          : "#475569",
        fontFamily: "Inter, -apple-system, sans-serif",
      },
      labelBgStyle: {
        fill: "#f8fafc",
        fillOpacity: 0.95,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    };
  });

  return { nodes, edges };
}
