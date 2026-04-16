"use client";

import { useState, useCallback } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  GitBranch,
  Folder,
  FolderOpen,
  FileJson,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface TreeNode {
  path: string;
  name: string;
  type: "tree" | "blob";
  children?: TreeNode[];
}

interface GitHubRepoBrowserProps {
  onFileSelect: (content: string) => void;
}

function parseGitHubUrl(url: string): {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
} | null {
  try {
    const cleaned = url.trim().replace(/\/$/, "");
    // Match: github.com/owner/repo, github.com/owner/repo/tree/branch/path
    const match =
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?$/.exec(
        cleaned,
      );
    if (!match) return null;
    return {
      owner: match[1]!,
      repo: match[2]!,
      branch: match[3],
      path: match[4],
    };
  } catch {
    return null;
  }
}

function buildTree(
  paths: { path: string; type: string }[],
  filterPath?: string,
): TreeNode[] {
  const root: TreeNode[] = [];

  // Filter to JSON files only, and optionally filter by path prefix
  const filtered = paths.filter((p) => {
    if (p.type === "tree") return true;
    if (!p.path.endsWith(".json")) return false;
    if (filterPath && !p.path.startsWith(filterPath)) return false;
    return true;
  });

  // Build nested structure
  const nodeMap = new Map<string, TreeNode>();

  for (const item of filtered) {
    const displayPath = filterPath
      ? item.path.slice(filterPath.length + 1)
      : item.path;
    if (!displayPath) continue;

    const parts = displayPath.split("/");
    let currentPath = filterPath ?? "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const fullPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      if (!nodeMap.has(fullPath)) {
        const node: TreeNode = {
          path: fullPath,
          name: part,
          type: isLast ? (item.type === "tree" ? "tree" : "blob") : "tree",
          children: isLast && item.type !== "tree" ? undefined : [],
        };
        nodeMap.set(fullPath, node);

        // Attach to parent
        if (currentPath && nodeMap.has(currentPath)) {
          nodeMap.get(currentPath)!.children?.push(node);
        } else if (!currentPath || !nodeMap.has(currentPath)) {
          if (i === 0) root.push(node);
        }
      }

      currentPath = fullPath;
    }
  }

  // Remove empty folders (folders with no JSON descendants)
  function pruneEmpty(nodes: TreeNode[]): TreeNode[] {
    return nodes.filter((node) => {
      if (node.type === "blob") return true;
      if (node.children) {
        node.children = pruneEmpty(node.children);
        return node.children.length > 0;
      }
      return false;
    });
  }

  return pruneEmpty(root);
}

function FileTreeNode({
  node,
  owner,
  repo,
  branch,
  onFileSelect,
  loadingFile,
  setLoadingFile,
}: {
  node: TreeNode;
  owner: string;
  repo: string;
  branch: string;
  onFileSelect: (content: string) => void;
  loadingFile: string | null;
  setLoadingFile: (path: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFileClick = async () => {
    setLoadingFile(node.path);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${node.path}?ref=${branch}`,
      );
      if (!res.ok) throw new Error("Failed to fetch file");
      const data = (await res.json()) as { content: string; encoding: string };
      const content = atob(data.content.replace(/\n/g, ""));
      onFileSelect(content);
    } catch (err) {
      console.error("Failed to fetch file:", err);
    } finally {
      setLoadingFile(null);
    }
  };

  if (node.type === "blob") {
    const isLoading = loadingFile === node.path;
    return (
      <button
        type="button"
        onClick={handleFileClick}
        disabled={isLoading}
        className={cn(
          "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent",
          isLoading && "opacity-50",
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <FileJson className="h-4 w-4 shrink-0 text-blue-500" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-accent">
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        {isOpen ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-yellow-500" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-yellow-500" />
        )}
        <span className="truncate">{node.name}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4">
        {node.children
          ?.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === "tree" ? -1 : 1;
          })
          .map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              owner={owner}
              repo={repo}
              branch={branch}
              onFileSelect={onFileSelect}
              loadingFile={loadingFile}
              setLoadingFile={setLoadingFile}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function GitHubRepoBrowser({
  onFileSelect,
}: GitHubRepoBrowserProps) {
  const [repoUrl, setRepoUrl] = useState("");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    repo: string;
    branch: string;
  } | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setError(null);
    setTree([]);
    setRepoInfo(null);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setError("Invalid GitHub URL. Use: https://github.com/owner/repo");
      return;
    }

    setLoading(true);
    try {
      const branch = parsed.branch ?? "main";

      const res = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`,
      );

      if (res.status === 404) {
        // Try 'master' if 'main' failed and no branch was specified
        if (!parsed.branch) {
          const retryRes = await fetch(
            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/master?recursive=1`,
          );
          if (!retryRes.ok) throw new Error("Repository or branch not found");
          const data = (await retryRes.json()) as {
            tree: { path: string; type: string }[];
          };
          setTree(buildTree(data.tree, parsed.path));
          setRepoInfo({ owner: parsed.owner, repo: parsed.repo, branch: "master" });
          return;
        }
        throw new Error("Repository or branch not found");
      }

      if (res.status === 403) {
        throw new Error("GitHub API rate limit exceeded. Try again later.");
      }

      if (!res.ok) throw new Error("Failed to fetch repository tree");

      const data = (await res.json()) as {
        tree: { path: string; type: string }[];
      };
      setTree(buildTree(data.tree, parsed.path));
      setRepoInfo({ owner: parsed.owner, repo: parsed.repo, branch });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [repoUrl]);

  return (
    <div className="space-y-3">
      <Label>GitHub Repository</Label>
      <div className="flex gap-2">
        <Input
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void fetchTree();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void fetchTree()}
          disabled={loading || !repoUrl.trim()}
          className="flex shrink-0 items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitBranch className="h-4 w-4" />
          )}
          Fetch
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {tree.length > 0 && repoInfo && (
        <div className="max-h-[300px] overflow-y-auto rounded-md border p-2">
          <p className="mb-2 text-xs text-muted-foreground">
            {repoInfo.owner}/{repoInfo.repo} ({repoInfo.branch}) — showing .json
            files
          </p>
          {tree
            .sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === "tree" ? -1 : 1;
            })
            .map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                owner={repoInfo.owner}
                repo={repoInfo.repo}
                branch={repoInfo.branch}
                onFileSelect={onFileSelect}
                loadingFile={loadingFile}
                setLoadingFile={setLoadingFile}
              />
            ))}
        </div>
      )}
      {tree.length === 0 && repoInfo && !loading && (
        <p className="text-sm text-muted-foreground">
          No JSON files found in this repository.
        </p>
      )}
    </div>
  );
}
