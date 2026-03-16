import Anthropic from "@anthropic-ai/sdk";

export const toolDefinitions: Anthropic.Tool[] = [
  {
    name: "bash",
    description:
      "Execute a shell command and return the combined stdout/stderr output and exit code.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute.",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "list_files",
    description:
      "List files and directories at a given path. Directories are shown with a trailing slash.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string",
          description:
            "The directory path to list. Defaults to the current working directory if empty.",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file at the given path as UTF-8 text.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to read.",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file at the given path, creating intermediate directories as needed. Overwrites existing files.",
    input_schema: {
      type: "object" as const,
      properties: {
        file_path: {
          type: "string",
          description: "The path to the file to write.",
        },
        content: {
          type: "string",
          description: "The content to write to the file.",
        },
      },
      required: ["file_path", "content"],
    },
  },
];
