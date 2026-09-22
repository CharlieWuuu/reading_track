/** 關係圖上的一顆節點：作品、片段、書寫共用這一種形狀 */
export interface GraphNode {
  id: string;
  label: string;
  kindName: string;
  groupKey: string; // records／fragments／writings，決定顏色
}

/** 一條站內連結。force graph 要求欄位就叫 source／target */
export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
