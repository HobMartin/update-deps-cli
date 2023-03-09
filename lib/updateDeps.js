const { Bitbucket } = require("bitbucket");
const { Select, MultiSelect, Input } = require("enquirer");
const { buildChoices, buildMultiChoices } = require("./helper");
const { loading } = require("cli-loading-animation");
const spinners = require("cli-spinners");
const { updatePackages } = require("../utils/package");

class BitbucketClient {
  constructor(auth, packages) {
    this.auth = auth;
    this.bucket = new Bitbucket({ auth });
    this.packages = packages;
  }

  async getWorkspace() {
    try {
      const { start, stop } = loading("Fetching workspaces...", {
        spinner: spinners.bouncingBall,
      });
      start();
      const { data } = await this.bucket.workspaces.getWorkspaces({
        role: "member",
      });
      const workspaces = data.values.map(({ name }) => name);
      const workspace = new Select({
        name: "value",
        message: "Pick your workspace:",
        choices: workspaces,
      });
      stop();
      this.workspace = await workspace.run();
    } catch (e) {
      console.error(e);
    }
  }

  async getRepositories() {
    try {
      const { start, stop } = loading("Fetching repositories...", {
        spinner: spinners.bouncingBall,
      });
      start();
      const { data } = await this.bucket.repositories.list({
        workspace: this.workspace,
      });
      const selectedRepositories = new Select({
        name: "repositories",
        message: "Pick repos to update:",
        choices: buildChoices(data.values),
      });
      stop();
      this.repository = await selectedRepositories.run();
    } catch (e) {
      console.error(e);
    }
  }

  async getBranch() {
    try {
      const branch = new Input({
        message: "Enter main branch name:",
        initial: "master",
      });
      this.mainBranch = await branch.run();
    } catch (e) {
      console.error(e);
    }
  }

  async init() {
    await this.getWorkspace();
    await this.getRepositories();
  }

  async createBranch() {
    try {
      const { start, stop } = loading("Creating branch...", {
        spinner: spinners.bouncingBall,
      });
      await this.getBranch();
      const version = (Math.random() * 1000) | 0;
      const branchName = `update-deps-${version}`;
      start();
      await this.bucket.repositories.createBranch({
        repo_slug: this.repository,
        workspace: this.workspace,
        _body: {
          name: branchName,
          target: {
            hash: this.mainBranch,
          },
        },
      });
      this.branch = branchName;
      stop();
      console.log(`✅ Branch ${this.branch} successfully created`);
    } catch (e) {
      console.error(e);
    }
  }

  async getLastCommit() {
    try {
      const branch = await this.bucket.repositories.getBranch({
        repo_slug: this.repository,
        workspace: this.workspace,
        name: this.branch,
      });
      return branch.data.target.hash;
    } catch (e) {
      console.error(e);
    }
  }

  async getFile(fileName) {
    const lastCommit = await this.getLastCommit();
    try {
      const { data } = await this.bucket.repositories.readSrc({
        repo_slug: this.repository,
        workspace: this.workspace,
        commit: lastCommit,
        path: fileName,
      });
      return data;
    } catch (e) {
      console.error(e);
    }
  }

  async commit(file) {
    try {
      const { start, stop } = loading("Wait for commit...", {
        spinner: spinners.bouncingBall,
      });
      start();
      await this.bucket.repositories.createSrcFileCommit({
        repo_slug: this.repository,
        workspace: this.workspace,
        branch: this.branch,
        author: "Redocly <info@redocly.com>",
        message: "Update dependencies",
        "package.json": file,
        files: "package.json",
      });
      stop();
      console.log(`✅ Commit successfully created`);
    } catch (e) {
      console.error(e);
    }
  }

  async getReviewers() {
    try {
      const { data } = await this.bucket.workspaces.getMembersForWorkspace({
        workspace: this.workspace,
      });

      const user = data.values.map((value) => value.user);

      const reviewers = new MultiSelect({
        name: "reviewers",
        message: "Select default reviewers:",
        choices: buildMultiChoices(user, {
          name: "display_name",
          value: "uuid",
        }),
        result(names) {
          return Object.values(this.map(names)).map((item) => ({ uuid: item }));
        },
      });
      return reviewers.run();
    } catch (e) {
      console.error(e);
    }
  }

  async createPullRequest() {
    try {
      const { start, stop } = loading("Creating pull request...", {
        spinner: spinners.bouncingBall,
      });
      const reviewers = await this.getReviewers();
      start();
      const { data } = await this.bucket.repositories.createPullRequest({
        repo_slug: this.repository,
        workspace: this.workspace,
        _body: {
          title: "Updated Dependencies",
          source: {
            branch: {
              name: this.branch,
            },
          },
          destination: {
            branch: {
              name: this.mainBranch,
            },
          },
          reviewers: reviewers,
        },
      });
      stop();
      console.log(
        `✅ Pull request successfully created. Watch more: ${data?.links?.html?.href}`
      );
    } catch (e) {
      console.error(e);
    }
  }

  async updateAndPull(fileName) {
    await this.createBranch();
    const file = await this.getFile(fileName);
    const newFile = updatePackages(this.packages, file);
    await this.commit(newFile);
    await this.createPullRequest();
  }
}

module.exports = BitbucketClient;
