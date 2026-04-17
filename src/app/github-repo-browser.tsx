"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
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

  const filtered = paths.filter((p) => {
    if (p.type === "tree") return true;
    if (!p.path.endsWith(".json")) return false;
    if (filterPath && !p.path.startsWith(filterPath)) return false;
    return true;
  });

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

        if (currentPath && nodeMap.has(currentPath)) {
          nodeMap.get(currentPath)!.children?.push(node);
        } else if (!currentPath || !nodeMap.has(currentPath)) {
          if (i === 0) root.push(node);
        }
      }

      currentPath = fullPath;
    }
  }

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
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [defaultBranch, setDefaultBranch] = useState<string>("");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInfo, setRepoInfo] = useState<{
    owner: string;
    repo: string;
    branch: string;
  } | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [parsedRepo, setParsedRepo] = useState<{
    owner: string;
    repo: string;
    path?: string;
  } | null>(null);

  // Track which repo URL we last fetched branches for, to avoid re-fetching
  const lastFetchedUrl = useRef("");

  const fetchBranches = useCallback(async (url: string) => {
    const parsed = parseGitHubUrl(url);
    if (!parsed) return;

    // Don't re-fetch for the same owner/repo
    const repoKey = `${parsed.owner}/${parsed.repo}`;
    if (lastFetchedUrl.current === repoKey) return;

    setError(null);
    setBranches([]);
    setSelectedBranch("");
    setDefaultBranch("");
    setTree([]);
    setRepoInfo(null);
    setParsedRepo({ owner: parsed.owner, repo: parsed.repo, path: parsed.path });
    setLoadingBranches(true);
    lastFetchedUrl.current = repoKey;

    try {
      // Fetch default branch from repo info
      const repoRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      );
      if (repoRes.status === 404) throw new Error("Repository not found");
      if (repoRes.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.");
      if (!repoRes.ok) throw new Error("Failed to fetch repository info");

      const repoData = (await repoRes.json()) as { default_branch: string };
      setDefaultBranch(repoData.default_branch);

      // Fetch branches (up to 100)
      const branchRes = await fetch(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches?per_page=100`,
      );
      if (!branchRes.ok) throw new Error("Failed to fetch branches");

      const branchData = (await branchRes.json()) as { name: string }[];
      const branchNames = branchData.map((b) => b.name);
      setBranches(branchNames);

      // Auto-select: URL branch > default branch
      const autoSelect = parsed.branch ?? repoData.default_branch;
      if (branchNames.includes(autoSelect)) {
        setSelectedBranch(autoSelect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      lastFetchedUrl.current = "";
    } finally {
      setLoadingBranches(false);
    }
  }, []);

  // Fetch tree when branch is selected
  const fetchTree = useCallback(async () => {
    if (!parsedRepo || !selectedBranch) return;

    setError(null);
    setTree([]);
    setRepoInfo(null);
    setLoadingTree(true);

    try {
      const res = await fetch(
        `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}/git/trees/${selectedBranch}?recursive=1`,
      );

      if (res.status === 404) throw new Error(`Branch "${selectedBranch}" not found`);
      if (res.status === 403) throw new Error("GitHub API rate limit exceeded. Try again later.");
      if (!res.ok) throw new Error("Failed to fetch repository tree");

      const data = (await res.json()) as {
        tree: { path: string; type: string }[];
      };
      setTree(buildTree(data.tree, parsedRepo.path));
      setRepoInfo({
        owner: parsedRepo.owner,
        repo: parsedRepo.repo,
        branch: selectedBranch,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoadingTree(false);
    }
  }, [parsedRepo, selectedBranch]);

  // Auto-fetch tree when branch changes
  useEffect(() => {
    if (selectedBranch && parsedRepo) {
      void fetchTree();
    }
  }, [selectedBranch, parsedRepo, fetchTree]);

  const handleUrlSubmit = () => {
    lastFetchedUrl.current = ""; // force refetch
    void fetchBranches(repoUrl);
  };

  return (
    <div className="space-y-3">
      <Label>GitHub Repository</Label>
      <div className="flex gap-2">
        <Input
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          onBlur={() => void fetchBranches(repoUrl)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleUrlSubmit();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUrlSubmit}
          disabled={loadingBranches || !repoUrl.trim()}
          className="flex shrink-0 items-center gap-2"
        >
          {loadingBranches ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Fetch"
          )}
        </Button>
      </div>
      {branches.length > 0 && (
        <div className="flex items-center gap-2">
          <Label className="shrink-0 text-sm">Branch</Label>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}{b === defaultBranch ? " (default)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loadingTree && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading files...
        </div>
      )}
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
      {tree.length === 0 && repoInfo && !loadingTree && (
        <p className="text-sm text-muted-foreground">
          No JSON files found in this repository.
        </p>
      )}
    </div>
  );
}
