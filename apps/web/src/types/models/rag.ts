export type TWorkspace = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

export type TDocument = {
  id: string;
  workspace_id: string;
  filename: string;
  storage_url: string;
  mime_type: string;
  size: string;
  content_hash: string;
  status: string;
  created_at: string;
};

export type TChatMessage = {
  id: string;
  workspace_id: string;
  role: string;
  content: string;
  citations?:
    | { filename: string; chunk_index: number; document_id?: string }[]
    | null;
  created_at: string;
};

export type TToolCall = {
  id: string;
  workspace_id: string;
  tool_name: string;
  arguments: unknown;
  result: unknown;
  status: string;
  created_at: string;
};

export type TTask = {
  id: string;
  workspace_id: string;
  title: string;
  description?: string | null;
  done: boolean;
  created_at: string;
};

export type TSendChatResponse = {
  userMessageId: string;
  message: TChatMessage;
  tool_calls_made?: { name: string; args: unknown }[];
};
