export type ToolCategory = "math" | "conversion" | "system" | "web";

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  requiresConfirmation: boolean;
  parameters: ToolParameter[];
}

export interface ToolExecutionLog {
  id: string;
  toolId: string;
  toolName: string;
  input: Record<string, any>;
  output: any;
  status: "success" | "error" | "denied";
  timestamp: string;
}
