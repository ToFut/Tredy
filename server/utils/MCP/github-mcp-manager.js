/**
 * GitHub MCP Manager
 * Manages cloning, updating, and running MCP servers from GitHub repositories
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class GitHubMCPManager {
  constructor() {
    // Store cloned repos in a dedicated directory
    this.reposDir = path.join(
      process.env.STORAGE_DIR || path.join(__dirname, "../../storage"),
      "mcp-repos"
    );

    // Ensure directory exists
    if (!fs.existsSync(this.reposDir)) {
      fs.mkdirSync(this.reposDir, { recursive: true });
    }
  }

  /**
   * Clone or update a GitHub repository
   * @param {string} repoUrl - GitHub repository URL or owner/repo format
   * @returns {string} - Path to the cloned repository
   */
  async cloneOrUpdate(repoUrl) {
    // Convert owner/repo to full URL if needed
    if (!repoUrl.startsWith("http")) {
      repoUrl = `https://github.com/${repoUrl}.git`;
    }

    // Extract repo name from URL
    const repoName = repoUrl.split("/").pop().replace(".git", "");
    const repoPath = path.join(this.reposDir, repoName);

    try {
      if (fs.existsSync(repoPath)) {
        // Update existing repo
        console.log(`[GitHubMCP] Updating ${repoName}...`);
        execSync("git pull", { cwd: repoPath });
      } else {
        // Clone new repo
        console.log(`[GitHubMCP] Cloning ${repoName}...`);
        execSync(`git clone ${repoUrl} ${repoPath}`, { cwd: this.reposDir });
      }

      // Install dependencies if package.json exists
      const packageJsonPath = path.join(repoPath, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        console.log(`[GitHubMCP] Installing dependencies for ${repoName}...`);
        execSync("npm install", { cwd: repoPath });
      }

      return repoPath;
    } catch (error) {
      console.error(`[GitHubMCP] Failed to clone/update ${repoName}:`, error);
      throw error;
    }
  }

  /**
   * Get the entry point for an MCP server
   * @param {string} repoPath - Path to the repository
   * @returns {string} - Path to the main entry file
   */
  getEntryPoint(repoPath) {
    // Check common entry points
    const possibleEntries = [
      "dist/index.js",
      "build/index.js",
      "lib/index.js",
      "src/index.js",
      "src/index.ts",
      "index.js",
      "server.js",
      "main.js",
    ];

    // Check package.json for main/bin field
    const packageJsonPath = path.join(repoPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      // Check bin field
      if (packageJson.bin) {
        const binPath =
          typeof packageJson.bin === "string"
            ? packageJson.bin
            : Object.values(packageJson.bin)[0];
        if (binPath) {
          possibleEntries.unshift(binPath);
        }
      }

      // Check main field
      if (packageJson.main) {
        possibleEntries.unshift(packageJson.main);
      }
    }

    // Find first existing entry point
    for (const entry of possibleEntries) {
      const fullPath = path.join(repoPath, entry);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(`No entry point found for MCP server in ${repoPath}`);
  }

  /**
   * Build TypeScript project if needed
   * @param {string} repoPath - Path to the repository
   */
  async buildIfNeeded(repoPath) {
    const packageJsonPath = path.join(repoPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Check if build script exists
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log(`[GitHubMCP] Building project...`);
      try {
        execSync("npm run build", { cwd: repoPath });
      } catch (error) {
        console.warn(
          `[GitHubMCP] Build failed, continuing anyway:`,
          error.message
        );
      }
    }
  }

  /**
   * Create MCP server configuration for a GitHub repo
   * @param {string} serverName - Name for the server
   * @param {string} repoUrl - GitHub repository URL
   * @param {object} options - Additional options (auth, env, etc.)
   * @returns {object} - MCP server configuration
   */
  async createGitHubMCPConfig(serverName, repoUrl, options = {}) {
    try {
      // Clone or update the repository
      const repoPath = await this.cloneOrUpdate(repoUrl);

      // Build if needed
      await this.buildIfNeeded(repoPath);

      // Get entry point
      const entryPoint = this.getEntryPoint(repoPath);

      // Determine how to run it
      const isTypeScript = entryPoint.endsWith(".ts");
      const command = isTypeScript ? "npx" : "node";
      const args = isTypeScript ? ["tsx", entryPoint] : [entryPoint];

      return {
        type: "stdio",
        command,
        args,
        env: {
          ...options.env,
          NODE_PATH: path.join(repoPath, "node_modules"),
        },
        anythingllm: {
          autoStart: true,
          source: "github",
          repository: repoUrl,
          description: options.description || `GitHub MCP: ${serverName}`,
          ...options.anythingllm,
        },
      };
    } catch (error) {
      console.error(
        `[GitHubMCP] Failed to create config for ${serverName}:`,
        error
      );
      return null;
    }
  }
}

module.exports = { GitHubMCPManager };
